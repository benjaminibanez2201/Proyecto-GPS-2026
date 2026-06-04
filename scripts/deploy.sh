#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  scripts/deploy.sh — ejecutado en el servidor UBB por auto-deploy.sh
#
#  Uso:
#      bash scripts/deploy.sh vX.Y.Z
#
#  Pre-requisitos (los deja setup-server.sh):
#    - Repo clonado en $DEPLOY_PATH (default /srv/arriendu)
#    - Node 20 LTS + npm
#    - pm2 global (gestor del backend)
#    - Apache configurado para servir frontend/dist y proxy a /api
#    - backend/.env con la conexión a la BD MySQL del lab
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "ERROR: pasa el tag a desplegar (ej: v1.2.3)" >&2
  exit 1
fi

DEPLOY_PATH="${DEPLOY_PATH:-/srv/arriendu}"
cd "$DEPLOY_PATH"

echo "════════════════════════════════════════════════════════════"
echo " Deploy ArriendU — tag $TAG — $(date -u +'%FT%TZ')"
echo "════════════════════════════════════════════════════════════"

# 1. Checkout exacto del tag (descartando cambios locales si los hubiera)
echo "→ git fetch + checkout $TAG"
git fetch --all --tags --prune --quiet
git checkout --force "tags/$TAG"

# 2. Backend: dependencias en modo producción
echo "→ backend: npm ci (omit dev)"
(
  cd backend
  npm ci --omit=dev --silent
)

# 3. Frontend: dependencias + build de producción
echo "→ frontend: npm ci + build"
(
  cd frontend
  npm ci --silent
  npm run build
)

# 4. Reiniciar backend con pm2
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe arriendu-backend >/dev/null 2>&1; then
    echo "→ pm2 reload arriendu-backend"
    pm2 reload arriendu-backend --update-env
  else
    echo "→ pm2 start arriendu-backend (primera vez)"
    pm2 start backend/src/index.js \
      --name arriendu-backend \
      --cwd "${DEPLOY_PATH}/backend" \
      --update-env
    pm2 save
  fi
else
  echo "⚠ pm2 no instalado — el backend NO se reinició. Instálalo con: sudo npm i -g pm2"
fi

# 5. Recargar Apache si está activo (sirve el frontend y hace proxy al backend)
if systemctl is-active --quiet apache2; then
  echo "→ systemctl reload apache2"
  sudo systemctl reload apache2 || echo "⚠ No se pudo recargar Apache (¿sudo sin password configurado?)"
else
  echo "  (Apache no está activo — se omite reload)"
fi

echo "✓ Deploy $TAG completado."
