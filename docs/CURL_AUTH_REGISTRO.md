# Pruebas con curl: autenticacion y registro

Fecha de ejecucion: 2026-06-03  
Base URL local: `http://localhost:3000/api`

## Preparacion local

1. Levantar PostgreSQL local en `localhost:5432`.
2. Verificar que `backend/.env` tenga las variables necesarias para DB, JWT y correo.
3. Levantar el backend:

```powershell
cd backend
npm.cmd run dev
```

El backend debe mostrar:

```text
=> Conexion exitosa a la base de datos!
=> Servidor corriendo en localhost:3000/api
=> API Iniciada exitosamente
```

Las credenciales de correo se usan solo desde `backend/.env` local y no se documentan en este archivo.

## Comandos usados

Para evitar problemas de escape de JSON en PowerShell, se recomienda enviar payloads desde archivos temporales:

```powershell
$payload = @{
  email = "administrador2024@gmail.cl"
  password = "Admin1234."
} | ConvertTo-Json -Compress

$payload | Set-Content .codex/admin-login.json -Encoding ASCII
curl.exe -sS -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  --data-binary "@.codex/admin-login.json"
Remove-Item .codex/admin-login.json
```

## Resultados verificados

### Login de administrador

Endpoint: `POST /auth/login`

Resultado: `200 OK`  
Mensaje: `Inicio de sesion exitoso`

### Registro de arrendador RF7

Endpoint: `POST /auth/register`

Payload usado para registrar a `sebastian.acua@gmail.com`:

```json
{
  "nombreCompleto": "Sebastian Acuna Soto",
  "email": "sebastian.acua@gmail.com",
  "rut": "12.345.678-9",
  "password": "Arrendador123.",
  "rol": "arrendador",
  "telefono": "+56 9 1234 5678",
  "fotoPerfil": {
    "name": "foto-perfil.png",
    "type": "image/png",
    "size": 204800
  },
  "documentoVerificacion": {
    "name": "carnet-identidad.jpg",
    "type": "image/jpeg",
    "size": 512000
  },
  "terminosAceptados": true
}
```

Resultado: `201 Created`  
Mensaje: `Usuario registrado con exito`  
Estado creado: `pendiente`

Nota RF7: el flujo actual envia JSON y guarda metadata simple del archivo. No almacena el binario del archivo porque el proyecto no tiene middleware de `multipart/form-data` ni almacenamiento de uploads.

### Registro duplicado

Se repitio el mismo payload del arrendador.

Resultado: `400 Bad Request`  
Mensaje: `Error registrando al usuario`  
Detalle: `Correo electronico en uso`

### Registro de arrendador con formato invalido

Payload con `fotoPerfil.type: "image/gif"` y `documentoVerificacion.type: "application/x-msdownload"`.

Resultado: `400 Bad Request`  
Mensaje: `Error de validacion`  
Detalle observado: `El documento de verificacion tiene un formato no permitido.`

### Registro de arrendador sin documento

Payload sin `documentoVerificacion`.

Resultado: `400 Bad Request`  
Mensaje: `Error de validacion`  
Detalle observado: `El documento de verificacion es obligatorio.`

### Registro sin terminos aceptados

Se omitio `terminosAceptados`.

Resultado: `400 Bad Request`  
Mensaje: `Error de validacion`  
Detalle: `Debes aceptar los terminos y condiciones`

### Registro de estudiante de control

Payload con `rol: "estudiante"`, `universidad`, `carrera` y `terminosAceptados: true`.

Resultado: `201 Created`  
Mensaje: `Usuario registrado con exito`

### Login de cuenta pendiente

Se intento iniciar sesion con `sebastian.acua@gmail.com`.

Resultado: `400 Bad Request`  
Mensaje: `Error iniciando sesion`  
Detalle: `Tu cuenta esta pendiente de verificacion. Por favor, espera a que sea aprobada.`

### Listado admin de usuarios

Endpoint: `GET /user/`

```powershell
curl.exe -sS -X GET http://localhost:3000/api/user/ `
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

Resultado: `200 OK`  
Mensaje: `Usuarios encontrados`

### Consulta admin por id

Endpoint: `GET /user/detail/?id=4`

```powershell
curl.exe -sS -X GET http://localhost:3000/api/user/detail/?id=4 `
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

Resultado: `200 OK`  
Mensaje: `Usuario encontrado`

Datos verificados para `sebastian.acua@gmail.com`:

- `id`: `4`
- `rol`: `arrendador`
- `estadoVerificacion`: `pendiente`
- `fotoPerfil`: `foto-perfil.png`
- `documentoVerificacion`: `carnet-identidad.jpg`
- `terminosAceptadosEn`: presente
- `password`: no se expone en la respuesta

## Observacion detectada

El registro acepta `sebastian.acua@gmail.com`, pero la consulta `GET /api/user/detail/?email=sebastian.acua@gmail.com` responde `400` porque la validacion de consulta de usuarios exige dominio `@gmail.cl`. La consulta por `id` funciona correctamente. Esto queda fuera del registro de arrendador y pertenece a la validacion de consulta/gestion de usuarios.

## Nota sobre correo

En el estado actual del backend, el endpoint `POST /api/auth/register` no invoca directamente el servicio de envio de correo, por lo que no existe un `curl` de registro que dispare envio de email. El registro si deja los datos listos para el flujo de verificacion y para usar correos cuando el flujo correspondiente los invoque.
