<div align="center">

<img src="frontend/src/assets/miLogo.png" alt="ArriendU" width="110" />

# ArriendU

**Plataforma web de arriendos para estudiantes universitarios del Gran Concepción**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

</div>

---

Conecta a **estudiantes** que buscan alojamiento con **arrendadores** verificados en Concepción, San Pedro de la Paz, Talcahuano, Chiguayante, Hualpén y Penco, e incluye un **panel administrativo** para moderar cuentas, publicaciones y reportes.

## Tabla de contenidos

- [Funcionalidades](#funcionalidades)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Scripts disponibles](#scripts-disponibles)
- [Documentación adicional](#documentación-adicional)
- [Licencia](#licencia)

## Funcionalidades

#### Estudiantes
- Búsqueda de arriendos con filtros (precio, tipo de inmueble, servicios, distancia al campus) y mapa interactivo por comuna.
- Favoritos y comparador de hasta 3 publicaciones lado a lado.
- Mensajería directa por publicación con el arrendador.
- Solicitud y confirmación de arriendos, historial y calificaciones a arrendadores.
- Reporte de publicaciones inapropiadas.

#### Arrendadores
- Publicación de inmuebles con fotos, servicios incluidos, reglas de convivencia y geolocalización automática por dirección/comuna.
- Gestión de publicaciones (editar, marcar como arrendada/disponible, eliminar) y estadísticas de visualizaciones, favoritos y conversaciones.
- Verificación de cuenta mediante documentos de identidad y comprobante de residencia.

#### Administradores
- Panel de auditoría, gestión y bloqueo de usuarios.
- Revisión y seguimiento de reportes de publicaciones.

#### Transversal
- Autenticación con JWT, recuperación de contraseña por correo y verificación de cuentas por email.
- Notificaciones dentro de la plataforma.
- Perfiles de usuario con foto, calificación promedio y reseñas recibidas.

## Tecnologías utilizadas

| Área | Tecnologías |
| --- | --- |
| **Backend** | Node.js · Express · TypeORM · PostgreSQL · JWT · Passport · Joi · Nodemailer · Multer |
| **Frontend** | React · Vite · React Router DOM · React Hook Form · Axios · Leaflet / React-Leaflet · SweetAlert2 · Lucide Icons |

## Estructura del repositorio

<details>
<summary>Ver árbol de carpetas</summary>

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
├── docs/
└── README.md
```

</details>

## Requisitos

- Node.js 18 o superior
- npm
- PostgreSQL

## Instalación

1. Clona el repositorio.
2. Instala las dependencias de cada proyecto:

   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
   ```

3. Crea los archivos de entorno a partir de los ejemplos disponibles (`backend/.env.example` y `frontend/.env.example`) y configúralos con tus datos locales.

## Variables de entorno

### Backend (`backend/.env`)

```env
HOST=localhost
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
DB_USERNAME=postgres
PASSWORD=tu_password
DATABASE=postgres
DB_PORT=5432
JWT_SECRET=tu_jwt_secret
COOKIE_KEY=tu_cookie_key

# Nodemailer
EMAIL_USER=email_de_la_app
EMAIL_PASS=app_password_de_gmail
EMAIL_FROM=ArriendU <email_de_la_app>
```

### Frontend (`frontend/.env`)

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

## Scripts disponibles

| Proyecto | Script | Descripción |
| --- | --- | --- |
| backend | `npm run dev` | Levanta el servidor con recarga automática (nodemon) |
| backend | `npm start` | Levanta el servidor en modo producción |
| backend | `npm run lint` / `lint:fix` | Revisa y corrige el estilo de código |
| backend | `npm run format` | Formatea el código con Prettier |
| frontend | `npm run dev` | Levanta el entorno de desarrollo (Vite) |
| frontend | `npm run build` | Genera el build de producción |
| frontend | `npm run preview` | Sirve el build de producción localmente |
| frontend | `npm run lint` | Revisa el estilo de código |

## Documentación adicional

- [docs/CURL_AUTH_REGISTRO.md](docs/CURL_AUTH_REGISTRO.md) — ejemplos de uso de la API de autenticación y registro con `curl`.

## Licencia

<div align="center">

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

</div>
