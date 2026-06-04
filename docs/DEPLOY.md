# Despliegue automático de ArriendU

Pipeline CI/CD adaptado al servidor del Laboratorio del Departamento de Sistemas de Información (UBB).

## Arquitectura

El servidor `146.83.198.35` está detrás de la VPN UBB. GitHub Actions corre en runners en la nube de Microsoft y **no puede conectarse directamente** al servidor. Por eso usamos un modelo **pull-based**: GitHub solo publica los releases; el servidor revisa y se actualiza solo.

```
   ┌───────────────────────────────────────────────────────────────┐
   │                       GitHub (la nube)                         │
   │                                                                │
   │  PR feature/RF1-... ──merge──▶  main                          │
   │                                  │                             │
   │                                  ▼                             │
   │            prepare-release.yml                                 │
   │              · calcula vX.Y.Z (por prefijo de rama)            │
   │              · genera CHANGELOG con IA                         │
   │              · abre PR release/vX.Y.Z → production             │
   │              · auto-merge                                      │
   │                                  │                             │
   │                                  ▼                             │
   │                              production                        │
   │                                  │                             │
   │                                  ▼                             │
   │            deploy.yml                                          │
   │              · crea tag vX.Y.Z                                 │
   │              · publica GitHub Release con notas                │
   └────────────────────────────────────┬──────────────────────────┘
                                        │ (el servidor consulta GH)
                                        ▼
   ┌───────────────────────────────────────────────────────────────┐
   │   Servidor UBB — 146.83.198.35 (detrás de VPN)                │
   │                                                                │
   │   cron cada 2 min:                                             │
   │     scripts/auto-deploy.sh                                     │
   │       ├─ git fetch --tags                                      │
   │       ├─ ¿hay tag nuevo? sí → scripts/deploy.sh vX.Y.Z         │
   │       │                         · npm ci backend + frontend    │
   │       │                         · npm run build (frontend)     │
   │       │                         · pm2 reload arriendu-backend  │
   │       │                         · systemctl reload apache2     │
   │       └─ ¿no? → no hace nada                                   │
   └───────────────────────────────────────────────────────────────┘
```

**Latencia total push→online:** ~3-5 minutos (workflows GitHub ~2 min + polling ~2 min).

## Convención de nombres de rama (versionado SemVer)

El bump se decide por el **prefijo del nombre de rama** del PR mergeado a `main`:

| Prefijo del PR        | Bump aplicado                              |
|-----------------------|--------------------------------------------|
| `feature/...`         | minor — `v0.X.0`                           |
| `fix/...`             | patch — `v0.0.X`                           |
| `migration/...`       | no bumpea (queda acumulada para el próximo release) |
| (otro)                | patch (fallback seguro)                    |

Reglas combinadas:
- Hay al menos un `feature/` → minor (las migraciones y fixes se incluyen igual).
- No hay feature pero sí fix → patch.
- Solo migrations o nada → no se genera release.

## Setup inicial (UNA SOLA VEZ)

### 1. Conectarte al servidor

Desde tu PC, conectado a la VPN UBB (`vpn-lab-UDP4-1107-Alumoscivil-config.ovpn`):

```bash
ssh -p 1206 macuna@146.83.198.35
# password: la que da el lab
```

Cambiar a root:

```bash
su -
# password de root: la que da el lab
```

### 2. Subir el script de bootstrap al servidor

Desde tu PC (en otra terminal, sin entrar al servidor):

```bash
scp -P 1206 scripts/setup-server.sh macuna@146.83.198.35:/tmp/
```

En el servidor (ya como root):

```bash
bash /tmp/setup-server.sh
```

El script es idempotente — instala Node 20, pm2, clona el repo en `/srv/arriendu`, configura sudoers, instala el cron de auto-deploy y te imprime los pasos manuales restantes.

### 3. Configurar deploy key (si el repo es privado)

Como el usuario `macuna` (sin sudo):

```bash
exit                                  # salir de root
ssh-keygen -t ed25519 -C 'deploy-arriendu-ubb' -f ~/.ssh/id_ed25519 -N ''
cat ~/.ssh/id_ed25519.pub
```

Copiar el output y pegarlo en:

> `https://github.com/<owner>/Proyecto-GPS-2026/settings/keys` → **Add deploy key**
> · Title: `Servidor UBB`
> · NO marcar "Allow write access" (solo lectura es suficiente)

Probar que funciona:

```bash
cd /srv/arriendu
git fetch --tags
```

Si no pide password y termina sin errores, OK.

### 4. Configurar `backend/.env`

```bash
cd /srv/arriendu/backend
cp .env.example .env   # si existe; si no, créalo de cero
nano .env
```

Contenido mínimo (ajustar según lo que use tu código):

```
PORT=3000
HOST=127.0.0.1
DB_HOST=146.83.198.35
DB_PORT=3306
DB_USER=macuna
DB_PASSWORD=<la del PDF del lab>
DB_NAME=arriendu_db
JWT_SECRET=<generar uno con: openssl rand -hex 32>
SESSION_SECRET=<otro distinto, idem>
```

> Nota: tu backend tiene `pg` (PostgreSQL) en `package.json`, pero el lab te dio MySQL. Cambia a `mysql2` + el driver de TypeORM correspondiente, o pídele al lab credenciales de PostgreSQL (`pgsqltrans.face.ubiobio.cl`).

### 5. Configurar Apache vhost

```bash
sudo nano /etc/apache2/sites-available/arriendu.conf
```

Pegar:

```apache
<VirtualHost *:1207>
    ServerName 146.83.198.35
    DocumentRoot /srv/arriendu/frontend/dist

    <Directory /srv/arriendu/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA fallback: cualquier ruta no-archivo → index.html
        FallbackResource /index.html
    </Directory>

    # Proxy /api/* → backend Node en puerto 3000
    ProxyPreserveHost On
    ProxyPass        /api/  http://127.0.0.1:3000/api/
    ProxyPassReverse /api/  http://127.0.0.1:3000/api/

    ErrorLog  ${APACHE_LOG_DIR}/arriendu-error.log
    CustomLog ${APACHE_LOG_DIR}/arriendu-access.log combined
</VirtualHost>
```

Habilitar módulos necesarios y el sitio:

```bash
sudo a2enmod proxy proxy_http rewrite
sudo a2dissite 000-default.conf
sudo a2ensite arriendu.conf
sudo apache2ctl configtest    # debe decir "Syntax OK"
sudo systemctl reload apache2
```

### 6. Disparar el primer deploy manual

```bash
sudo -u macuna bash /srv/arriendu/scripts/auto-deploy.sh
```

Si todo va bien, el backend queda corriendo (verificar con `pm2 list`) y el frontend servido por Apache en `http://146.83.198.35:1207`.

### 7. Configurar GitHub (no requiere VPN)

En `https://github.com/<owner>/Proyecto-GPS-2026`:

**Settings → Actions → General → Workflow permissions:**
- Marcar **Read and write permissions**
- Marcar **Allow GitHub Actions to create and approve pull requests**

**Settings → Branches → Add rule** (opcional pero recomendado):
- Branch name pattern: `production`
- Restrict who can push (solo el bot)

**Settings → Models** (primera vez):
- Aceptar términos de GitHub Models (para que `actions/ai-inference` funcione)

> A diferencia del plan anterior, **no necesitas configurar secrets SSH** en GitHub. El servidor se actualiza solo.

## Flujo del día a día

1. Trabajás en `feature/RF1-registro` y abrís PR a `main`.
2. Lo mergeás → el resto es automático:

   ```
   main ──prepare-release.yml──▶ release/v0.2.0 ──auto-merge──▶ production
                                                                    │
                                                            deploy.yml crea tag v0.2.0
                                                                    │
                                              cron del servidor lo detecta (≤ 2 min)
                                                                    │
                                                       auto-deploy.sh corre deploy.sh
                                                                    │
                                                  servidor sirviendo v0.2.0 en :1207
   ```

## Monitoreo y troubleshooting

```bash
# Ver el log del cron de auto-deploy en vivo
ssh -p 1206 macuna@146.83.198.35
tail -f /var/log/arriendu-deploy.log

# Ver estado del backend
pm2 list
pm2 logs arriendu-backend --lines 100

# Ver último tag desplegado
cat /srv/arriendu/.last-deployed-tag

# Forzar un re-deploy del último tag
sudo rm /srv/arriendu/.last-deployed-tag
sudo -u macuna bash /srv/arriendu/scripts/auto-deploy.sh

# Apache
sudo tail -f /var/log/apache2/arriendu-error.log
sudo systemctl status apache2
```

## Problemas comunes

| Síntoma                                       | Probable causa                       | Solución                                                                          |
|-----------------------------------------------|--------------------------------------|-----------------------------------------------------------------------------------|
| `git fetch` pide password                     | Deploy key no configurada            | Repetir paso 3                                                                    |
| `pm2: command not found`                      | pm2 no instalado                     | `sudo npm i -g pm2`                                                               |
| Apache 502 Bad Gateway                        | Backend caído                        | `pm2 list` + `pm2 logs arriendu-backend`                                          |
| Cron no se dispara                            | No tiene permisos / log no escribe   | `sudo grep CRON /var/log/syslog \| tail -20`                                       |
| El workflow IA falla                          | No aceptaste términos de Models      | GitHub → Settings → Models → aceptar                                              |
| El PR a production no se crea                 | Falta permiso de Workflow            | Settings → Actions → General → "Read and write" + "Allow Actions to create PRs"   |

## Archivos involucrados

- `.github/workflows/prepare-release.yml` — corre en GitHub: calcula versión, abre PR a production, auto-merge.
- `.github/workflows/deploy.yml` — corre en GitHub: crea tag + GitHub Release (NO hace SSH).
- `scripts/auto-deploy.sh` — corre en el servidor cada 2 min vía cron. Detecta tags nuevos.
- `scripts/deploy.sh` — corre en el servidor cuando hay tag nuevo. Hace el deploy real.
- `scripts/setup-server.sh` — corre UNA SOLA VEZ como root en el servidor para el bootstrap.
- `CHANGELOG.md` — generado automáticamente por el primer workflow.
