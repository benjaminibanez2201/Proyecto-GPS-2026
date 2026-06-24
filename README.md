## Proyecto GPS 2026

Aplicación web para gestión de arriendos de estudiantes universitarios.
## Resumen

El repositorio está dividido en dos partes:

- `backend`: API, autenticación, base de datos, correos y lógica de negocio.
- `frontend`: interfaz web, navegación, formularios y consumo de la API.

## Estructura del repositorio

```text
.
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── entity/
│   │   ├── handlers/
│   │   ├── helpers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validations/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── helpers/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
└── README.md
```

## Tecnologias utilizadas

- Node.js, Express y TypeORM.
- PostgreSQL.
- React, Vite y React Router DOM.
- Axios, React Hook Form y SweetAlert2.

## Requisitos

- Node.js 18 o superior.
- npm.
- PostgreSQL.

## Instalacion

1. Clona el repositorio.
2. Instala dependencias en cada proyecto:

```bash
cd backend
npm install

cd ../frontend
npm install
```

3. Crea los archivos de entorno a partir de los ejemplos disponibles:

- `backend/.env.example`
- `frontend/.env.example`

4. Configura las variables de entorno con tus datos locales.

## Variables de entorno

### Backend

Configura `backend/.env` con valores similares a estos:

```env
HOST=localhost
PORT=3000
FRONTEND_URL=http://localhost:5173
DB_USERNAME=postgres
PASSWORD=tu_password
DATABASE=postgres
DB_PORT=5432
JWT_SECRET=tu_jwt_secret
COOKIE_KEY=tu_cookie_key
EMAIL_USER=email_de_la_app
EMAIL_PASS=password
```

### Frontend

Configura `frontend/.env`:

```env
VITE_BASE_URL=http://localhost:3000/api
```

## Ejecución

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Pruebas funcionales

La guia de validacion de requisitos funcionales esta en:

- `docs/testing/README.md`
- `docs/testing/curls.md`
- `postman/ArriendU_RF_Testing.postman_collection.json`
- `postman/ArriendU_Local.postman_environment.json`
- `scripts/run-rf-smoke.ps1`

Para una validacion rapida:

```powershell
.\scripts\run-rf-smoke.ps1
```

La coleccion Postman se importa como `ArriendU - Pruebas RF Completa` y cubre `RF_01` a `RF_34`. Primero importa el environment local, selecciona `ArriendU Local` y ejecuta la carpeta `00 - Login y tokens base`. Cada request incluye URL, headers, body y cURL equivalente en su descripcion.

## Estado del proyecto

El proyecto está en desarrollo y algunas funcionalidades siguen en ajustándose.

## Licencia

MIT
