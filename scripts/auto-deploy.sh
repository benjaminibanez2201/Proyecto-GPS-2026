#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  scripts/auto-deploy.sh — corre en el SERVIDOR UBB cada 2 minutos (cron)
#
#  Estrategia "pull": como el servidor está detrás de la VPN UBB, GitHub
#  Actions no puede llegar acá. En vez de eso, este script consulta GitHub
#  y, si hay un tag nuevo en el repo, ejecuta scripts/deploy.sh para
#  actualizar el código.
#
#  Idempotente: si ya está en el último tag, no hace nada (solo loguea).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/srv/arriendu}"
LOCK_FILE="/tmp/arriendu-auto-deploy.lock"
LAST_TAG_FILE="${DEPLOY_PATH}/.last-deployed-tag"

cd "$DEPLOY_PATH"

# Evitar dos deploys simultáneos (si un deploy se demora > 2 min, el siguiente cron tick lo respeta)
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date -u +'%FT%TZ')] Otro auto-deploy ya está corriendo, salgo."
  exit 0
fi

# Traer tags nuevos desde GitHub (sin VPN, salida hacia internet → github.com)
git fetch --tags --quiet origin production

# Último tag remoto con formato vX.Y.Z
REMOTE_TAG=$(git tag -l 'v*.*.*' --sort=-v:refname | head -n 1 || true)
if [ -z "$REMOTE_TAG" ]; then
  echo "[$(date -u +'%FT%TZ')] No hay tags en el repo todavía."
  exit 0
fi

# Último tag que dejamos desplegado (si nunca se hizo deploy, queda vacío)
LAST_DEPLOYED=""
if [ -f "$LAST_TAG_FILE" ]; then
  LAST_DEPLOYED=$(cat "$LAST_TAG_FILE")
fi

if [ "$REMOTE_TAG" = "$LAST_DEPLOYED" ]; then
  # Estamos al día — silenciosamente OK.
  exit 0
fi

echo "════════════════════════════════════════════════════════════"
echo "[$(date -u +'%FT%TZ')] Tag nuevo detectado: ${LAST_DEPLOYED:-<ninguno>} → $REMOTE_TAG"
echo "════════════════════════════════════════════════════════════"

# Ejecutar el deploy real
if bash "${DEPLOY_PATH}/scripts/deploy.sh" "$REMOTE_TAG"; then
  echo "$REMOTE_TAG" > "$LAST_TAG_FILE"
  echo "[$(date -u +'%FT%TZ')] ✓ Deploy $REMOTE_TAG completado."
else
  echo "[$(date -u +'%FT%TZ')] ✗ FALLÓ el deploy a $REMOTE_TAG (no se actualiza .last-deployed-tag)."
  exit 1
fi
