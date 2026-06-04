#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  scripts/setup-server.sh — bootstrap ONE-TIME del servidor UBB
#
#  Servidor: 146.83.198.35 (Ubuntu 22.04, requiere VPN UBB para conectarse)
#
#  Uso (después de conectarte por SSH al servidor como usuario macuna y hacer su):
#      sudo bash setup-server.sh
#
#  Es IDEMPOTENTE — podés correrlo varias veces sin romper nada.
#
#  Qué hace:
#    1. Instala dependencias del sistema (git, curl, build tools)
#    2. Instala Node.js 20 LTS via nodesource
#    3. Instala pm2 global
#    4. Clona o actualiza el repo en /srv/arriendu
#    5. Configura sudoers para que macuna pueda reload Apache sin password
#    6. Instala el cron que ejecuta auto-deploy.sh cada 2 minutos
#    7. Imprime los pasos manuales restantes (Apache vhost, .env, deploy key)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "ERROR: corre este script como root (usa 'su' y luego 'sudo bash setup-server.sh')" >&2
  exit 1
fi

DEPLOY_USER="${DEPLOY_USER:-macuna}"
DEPLOY_PATH="${DEPLOY_PATH:-/srv/arriendu}"
REPO_URL="${REPO_URL:-git@github.com:Marc0cl/Proyecto-GPS-2026.git}"  # ajustar al fork/repo real
NODE_MAJOR="${NODE_MAJOR:-20}"

echo "════════════════════════════════════════════════════════════"
echo " Bootstrap ArriendU en $(hostname) — $(date -u +'%FT%TZ')"
echo " Usuario: $DEPLOY_USER · Repo: $REPO_URL"
echo "════════════════════════════════════════════════════════════"

# ───── 1. Paquetes del sistema ─────
echo "→ apt update + dependencias base"
apt-get update -qq
apt-get install -y -qq git curl ca-certificates build-essential

# ───── 2. Node.js 20 LTS ─────
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | grep -oE '^v[0-9]+' | tr -d v)" -lt "$NODE_MAJOR" ]; then
  echo "→ Instalando Node.js ${NODE_MAJOR} LTS"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
else
  echo "→ Node $(node -v) ya instalado, OK"
fi

# ───── 3. pm2 global ─────
if ! command -v pm2 >/dev/null 2>&1; then
  echo "→ Instalando pm2"
  npm install -g pm2
else
  echo "→ pm2 ya instalado, OK"
fi

# ───── 4. Clonar / actualizar repo ─────
mkdir -p "$DEPLOY_PATH"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_PATH"

if [ ! -d "${DEPLOY_PATH}/.git" ]; then
  echo "→ Clonando repo en $DEPLOY_PATH"
  echo "  IMPORTANTE: si el repo es PRIVADO, primero configura la deploy key (ver pasos manuales)"
  sudo -u "$DEPLOY_USER" git clone "$REPO_URL" "$DEPLOY_PATH"
else
  echo "→ Repo ya clonado, fetch inicial"
  sudo -u "$DEPLOY_USER" git -C "$DEPLOY_PATH" fetch --all --tags --quiet
fi

# Asegurar que estamos en production
sudo -u "$DEPLOY_USER" git -C "$DEPLOY_PATH" checkout production 2>/dev/null || \
  echo "  (la rama production aún no existe en remote — se creará en el primer push del workflow)"

# ───── 5. Sudoers para reload de Apache sin password ─────
SUDOERS_FILE="/etc/sudoers.d/arriendu-deploy"
echo "→ Configurando sudoers ($SUDOERS_FILE)"
cat > "$SUDOERS_FILE" <<EOF
# Permite a $DEPLOY_USER reload Apache sin password (necesario para auto-deploy)
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload apache2, /bin/systemctl restart apache2
EOF
chmod 0440 "$SUDOERS_FILE"
visudo -c -f "$SUDOERS_FILE"

# ───── 6. Cron de auto-deploy ─────
CRON_FILE="/etc/cron.d/arriendu-auto-deploy"
echo "→ Instalando cron en $CRON_FILE (cada 2 min)"
cat > "$CRON_FILE" <<EOF
# Auto-deploy ArriendU — revisa GitHub cada 2 min y deploya si hay tag nuevo
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
*/2 * * * * $DEPLOY_USER cd $DEPLOY_PATH && bash scripts/auto-deploy.sh >> /var/log/arriendu-deploy.log 2>&1
EOF
chmod 0644 "$CRON_FILE"

# Crear log file con permisos correctos
touch /var/log/arriendu-deploy.log
chown "$DEPLOY_USER:$DEPLOY_USER" /var/log/arriendu-deploy.log

# Hacer ejecutables los scripts
chmod +x "${DEPLOY_PATH}/scripts/"*.sh 2>/dev/null || true

echo ""
echo "════════════════════════════════════════════════════════════"
echo " ✓ Bootstrap completado."
echo "════════════════════════════════════════════════════════════"
echo ""
echo "PASOS MANUALES PENDIENTES:"
echo ""
echo "  1. DEPLOY KEY (si el repo es privado):"
echo "     Como usuario $DEPLOY_USER, generar una llave SSH y agregarla a GitHub."
echo "       su - $DEPLOY_USER"
echo "       ssh-keygen -t ed25519 -C 'deploy-arriendu-ubb' -f ~/.ssh/id_ed25519 -N ''"
echo "       cat ~/.ssh/id_ed25519.pub"
echo "     → Copiar el output y pegarlo en:"
echo "       https://github.com/<owner>/Proyecto-GPS-2026/settings/keys"
echo "       (Title: 'Servidor UBB', NO marcar 'Allow write access')"
echo ""
echo "  2. backend/.env:"
echo "       cd $DEPLOY_PATH/backend"
echo "       cp .env.example .env      # si existe el example"
echo "       nano .env                 # completar DB_HOST=146.83.198.35, DB_USER=macuna, etc."
echo ""
echo "  3. Apache vhost (servir frontend + proxy al backend):"
echo "     Ver: docs/DEPLOY.md sección 'Configuración Apache'"
echo ""
echo "  4. Primer deploy manual de prueba (opcional):"
echo "       sudo -u $DEPLOY_USER bash $DEPLOY_PATH/scripts/auto-deploy.sh"
echo ""
echo "  5. Ver logs del cron en vivo:"
echo "       tail -f /var/log/arriendu-deploy.log"
echo ""
