#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Uso: ./deployar <rama>"
  echo "Ejemplo: ./deployar Dev2"
  exit 1
fi

BRANCH="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_PM2="gps-backend"
FRONTEND_PM2="gps-frontend"

echo "Desplegando rama: $BRANCH"

command -v git >/dev/null 2>&1 || { echo "ERROR: falta git" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: falta npm" >&2; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "ERROR: falta pm2" >&2; exit 1; }

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "ERROR: hay cambios locales tracked sin commitear. Haz commit o stash antes de desplegar." >&2
  git status --short --untracked-files=no
  exit 1
fi

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "Instalando backend..."
(
  cd backend
  npm install
)

echo "Instalando frontend..."
(
  cd frontend
  npm install
  npm run build
)

echo "Reiniciando backend en PM2: $BACKEND_PM2"
if pm2 describe "$BACKEND_PM2" >/dev/null 2>&1; then
  pm2 restart "$BACKEND_PM2" --update-env
else
  pm2 start npm --name "$BACKEND_PM2" --cwd "$ROOT_DIR/backend" -- run start
fi

echo "Reiniciando frontend en PM2: $FRONTEND_PM2"
if pm2 describe "$FRONTEND_PM2" >/dev/null 2>&1; then
  pm2 restart "$FRONTEND_PM2" --update-env
else
  pm2 start npm --name "$FRONTEND_PM2" --cwd "$ROOT_DIR/frontend" -- run preview
fi

pm2 save

echo "Listo."
echo "Backend: $BACKEND_PM2"
echo "Frontend: $FRONTEND_PM2"
