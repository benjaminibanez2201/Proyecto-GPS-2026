# Guia de pruebas funcionales ArriendU

Esta carpeta concentra la base de validacion funcional del proyecto. El objetivo es que el equipo pueda probar los RF sin tocar codigo de otros modulos y con una misma forma de ejecutar backend, frontend, curls y Postman.

## Archivos

- `docs/testing/README.md`: guia principal, matriz RF y observaciones.
- `docs/testing/curls.md`: comandos `curl.exe` por RF.
- `postman/ArriendU_RF_Testing.postman_collection.json`: coleccion Postman importable.
- `postman/ArriendU_Local.postman_environment.json`: environment local para Postman.
- `scripts/generate-postman-rf.mjs`: regenera la coleccion y el environment.
- `scripts/run-rf-smoke.ps1`: smoke test de RF no destructivos y algunos mutantes opcionales.

## Preparacion local

1. Levantar PostgreSQL en `localhost:5432`.
2. Configurar `backend/.env` a partir de `backend/.env.example`.
3. Configurar `frontend/.env` solo si se necesita sobrescribir la API. Si no existe, el frontend usa `http://localhost:3000/api`.
4. Instalar dependencias si falta `node_modules`:

```powershell
cd backend
npm.cmd install
cd ..\frontend
npm.cmd install
```

5. Levantar backend:

```powershell
cd backend
npm.cmd run dev
```

Debe aparecer una salida equivalente a:

```text
=> Conexion exitosa a la base de datos!
=> Servidor corriendo en localhost:3000/api
=> API Iniciada exitosamente
```

6. Levantar frontend:

```powershell
cd frontend
npm.cmd run dev -- --host 127.0.0.1
```

## Usuarios semilla

`backend/src/config/initialSetup.js` crea estos usuarios cuando la base esta inicializada:

| Rol | Email | Password |
|---|---|---|
| Admin | `administrador2024@gmail.cl` | `Admin1234.` |
| Estudiante | `estudiante1@gmail.cl` | `Estudiante1234.` |
| Arrendador | `arrendador1@gmail.cl` | `Arrendador1234.` |

Tambien crea una publicacion base para mensajes si existe el arrendador semilla.

## Como usar Postman

1. Importar `postman/ArriendU_RF_Testing.postman_collection.json`; en Postman debe quedar como `ArriendU - Pruebas RF Completa`.
2. Importar `postman/ArriendU_Local.postman_environment.json`.
3. Seleccionar environment `ArriendU Local`.
4. Ejecutar primero la carpeta `00 - Login y tokens base`.
5. Revisar variables `tokenAdmin`, `tokenEstudiante` y `tokenArrendador`.
6. Ejecutar RF individuales o la carpeta completa `01 - Cobertura RF_01 a RF_34`.

Notas:

- Los RF de registro requieren seleccionar archivos locales en Postman.
- Cada request incluye URL estructurada, headers, body y un cURL equivalente en su descripcion.
- Los RF que dependen de IDs (`publicacionId`, `rentalId`, `reviewId`, `notificacionId`) usan valores del environment y pueden requerir ajuste segun la base local.
- El RF_33 requiere pegar en `verificationToken` el token recibido por correo.
- El RF_34 queda documentado, pero el endpoint de estadisticas requiere revision porque la ruta existe en el repo pero no esta montada actualmente en `index.routes.js`.

## Como usar curls

Ver `docs/testing/curls.md`. Se recomienda ejecutar primero los login para obtener tokens:

```powershell
$env:BASE_URL = "http://localhost:3000/api"
```

Luego seguir los comandos por RF.

## Automatizacion smoke

Ejecutar pruebas no destructivas:

```powershell
.\scripts\run-rf-smoke.ps1
```

Ejecutar tambien pruebas que crean o modifican datos:

```powershell
.\scripts\run-rf-smoke.ps1 -RunMutating
```

## Matriz de cobertura RF

| RF | Nombre | Prueba principal | Tipo | Estado actual esperado |
|---|---|---|---|---|
| RF_01 | Registro de estudiante | `POST /api/auth/register` multipart | API/Postman/manual archivos | Automatizable con archivos locales |
| RF_02 | Inicio de sesion usuario | `POST /api/auth/login` | API/Postman/curl | Automatizable |
| RF_03 | Edicion perfil estudiante | `PATCH /api/profile` | API/Postman/curl | Automatizable |
| RF_04 | Busqueda publicaciones | `GET /api/publicacion` | API/Postman/curl/UI | Automatizable parcialmente; distancia/servicios no estan en backend |
| RF_05 | Visualizacion publicacion | `GET /api/publicacion/:id` | API/Postman/curl/UI | Automatizable |
| RF_06 | Guardar favoritos | `POST /api/favoritos` | API/Postman/curl/UI | Automatizable |
| RF_07 | Registro arrendador | `POST /api/auth/register` multipart | API/Postman/manual archivos | Automatizable con archivos locales |
| RF_08 | Crear publicacion | `POST /api/publicacion` | API/Postman/curl/UI | Automatizable con token arrendador |
| RF_09 | Editar/eliminar publicacion | `PUT /api/publicacion/:id`, `DELETE /api/publicacion/:id` | API/Postman/curl/UI | Automatizable; usar datos de prueba |
| RF_10 | Mensajes recibidos | `GET /api/mensajes/conversaciones`, `POST /api/mensajes/conversaciones/:id/mensajes` | API/Postman/curl | API disponible; UI menu aparece como proximo |
| RF_11 | Calificar estudiantes | `POST /api/reviews` | API/Postman/curl | Requiere arriendo `COMPLETED` |
| RF_12 | Login administrador | `POST /api/auth/login` | API/Postman/curl/UI | Automatizable |
| RF_13 | Revision documentos | `PATCH /api/user/detail/verification` | API/Postman/curl/admin | API disponible; UI de modal requiere revisar cableado |
| RF_14 | Gestion usuarios | `GET/PATCH/DELETE /api/user/detail` | API/Postman/curl/admin | Automatizable parcialmente; delete solo en datos de prueba |
| RF_15 | Publicaciones reportadas | `GET/PATCH /api/reportes` | API/Postman/curl/admin | API disponible; UI menu aparece como proximo |
| RF_16 | Usuarios registrados | `GET /api/user` | API/Postman/curl/admin | Automatizable |
| RF_17 | Terminos y condiciones | `POST /api/auth/register` sin `terminosAceptados` | API/Postman/curl/UI | Prueba negativa automatizable |
| RF_18 | Inicio conversacion | `POST /api/mensajes/contacto` | API/Postman/curl | API disponible; boton de detalle no esta cableado |
| RF_19 | Calificar arrendador | `POST /api/reviews` | API/Postman/curl | Requiere arriendo `COMPLETED` |
| RF_20 | Reportar publicacion | `POST /api/reportes/publicacion` | API/Postman/curl | Automatizable |
| RF_21 | Recuperar password | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password/:token` | API/Postman/curl/email | Solicitud automatizable; reset requiere token de correo |
| RF_22 | Editar perfil arrendador | `PATCH /api/profile/arrendador` | API/Postman/curl/UI | Automatizable |
| RF_23 | Confirmar arriendo | `POST /api/rentals/:id/confirm` | API/Postman/curl | Requiere arriendo creado para ambas partes |
| RF_24 | Visualizar perfil publico | `GET /api/profile/:id` | API/Postman/curl/UI | Automatizable |
| RF_25 | Centro notificaciones | `GET/PATCH/DELETE /api/notificaciones` | API/Postman/curl/UI | Automatizable |
| RF_26 | Notificaciones por correo | Eventos de aprobacion, mensaje y arriendo completado | Integracion/email | Validacion parcial por notificaciones internas y logs/email |
| RF_27 | Perfil propio | `GET /api/profile` | API/Postman/curl/UI | Automatizable |
| RF_28 | Mis publicaciones | `GET /api/publicacion/mis-publicaciones` | API/Postman/curl/UI | Automatizable |
| RF_29 | Historial arriendos | `GET /api/rentals` | API/Postman/curl/UI | Automatizable |
| RF_30 | Eliminar favorito | `DELETE /api/favoritos/:publicacionId` | API/Postman/curl/UI | Automatizable |
| RF_31 | Calificaciones recibidas | `GET /api/reviews/received` | API/Postman/curl/UI | Automatizable |
| RF_32 | Mapa interactivo | `GET /api/publicacion` + validacion visual mapa | UI/API | API automatizable; mapa requiere prueba visual |
| RF_33 | Verificacion correo | `GET /api/auth/confirm-email/:token` | API/Postman/curl/email | Requiere token real del correo |
| RF_34 | Estadisticas arrendador | `GET /api/publicacion/:id/estadisticas` | API/Postman/curl | Riesgo: ruta no montada e inconsistencias con entidad |

## Riesgos detectados para no romper trabajo ajeno

- `auth`, `user` y `mensajes` estan montados bajo `/api` y tambien directo en raiz. La guia usa `/api` para mantener una convencion unica.
- `publicacion.estadisticas.routes.js` existe, pero no esta montada en `backend/src/routes/index.routes.js`.
- La implementacion actual de estadisticas parece usar nombres de campos que no coinciden con `Publicacion` (`id_publicacion`, `owner`, `activo` versus `id`, `arrendador`, `estado`).
- `POST /api/rentals` no envia `publicacionId`, aunque la entidad `Arriendo` lo tiene como no nullable.
- Algunos botones del frontend aparecen como `Proximamente` o sin handler visible: mensajes del sidebar, publicaciones reportadas y contacto interno desde perfil/detalle.
- Los RF de correo dependen de `EMAIL_USER`, `EMAIL_PASS` y del proveedor de correo; si fallan, la prueba debe revisar logs y respuesta de API.
