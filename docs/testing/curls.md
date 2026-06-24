# Curls por requisito funcional

Estos comandos usan PowerShell y `curl.exe`. Ajusta IDs y tokens segun tu base local.

## Variables base

```powershell
$env:BASE_URL = "http://localhost:3000/api"
$env:PUBLICACION_ID = "1"
$env:RENTAL_ID = "1"
$env:USER_ID_ESTUDIANTE = "2"
$env:USER_ID_ARRENDADOR = "3"
$env:USER_ID_PENDIENTE = "4"
$env:VERIFICATION_TOKEN = "pegar-token-del-correo"
```

## Login y tokens

```powershell
$adminLogin = curl.exe -sS -X POST "$env:BASE_URL/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"administrador2024@gmail.cl","password":"Admin1234."}' | ConvertFrom-Json
$env:TOKEN_ADMIN = $adminLogin.data.token

$estudianteLogin = curl.exe -sS -X POST "$env:BASE_URL/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"estudiante1@gmail.cl","password":"Estudiante1234."}' | ConvertFrom-Json
$env:TOKEN_ESTUDIANTE = $estudianteLogin.data.token

$arrendadorLogin = curl.exe -sS -X POST "$env:BASE_URL/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"arrendador1@gmail.cl","password":"Arrendador1234."}' | ConvertFrom-Json
$env:TOKEN_ARRENDADOR = $arrendadorLogin.data.token
```

## RF_01 - Registro de estudiante

Requiere archivos locales validos.

```powershell
curl.exe -sS -X POST "$env:BASE_URL/auth/register" `
  -F "nombreCompleto=Estudiante Prueba Curls" `
  -F "email=estudiante.curl.$(Get-Random)@example.com" `
  -F "rut=18.111.111-1" `
  -F "password=Estudiante1234." `
  -F "rol=estudiante" `
  -F "universidad=Universidad del Bio Bio" `
  -F "carrera=Ingenieria Civil Informatica" `
  -F "terminosAceptados=true" `
  -F "documentoVerificacion=@C:\ruta\certificado.pdf;type=application/pdf" `
  -F "carnetIdentidadFrontal=@C:\ruta\carnet-frontal.jpg;type=image/jpeg" `
  -F "carnetIdentidadReverso=@C:\ruta\carnet-reverso.jpg;type=image/jpeg"
```

## RF_02 - Inicio de sesion

```powershell
curl.exe -sS -X POST "$env:BASE_URL/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"estudiante1@gmail.cl","password":"Estudiante1234."}'
```

## RF_03 - Edicion de perfil estudiante

```powershell
curl.exe -sS -X PATCH "$env:BASE_URL/profile" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE" `
  -H "Content-Type: application/json" `
  -d '{"nombreCompleto":"Usuario Estudiante Actualizado","universidad":"Universidad del Bio Bio","carrera":"Ingenieria Civil Informatica"}'
```

## RF_04 - Busqueda de publicaciones

```powershell
curl.exe -sS -X GET "$env:BASE_URL/publicacion?precioMax=350000&tipoInmueble=departamento&ordenarPor=precioMensual&direccionOrden=ASC" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_05 - Visualizacion de publicacion

```powershell
curl.exe -sS -X GET "$env:BASE_URL/publicacion/$env:PUBLICACION_ID" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_06 - Guardar favorito

```powershell
curl.exe -sS -X POST "$env:BASE_URL/favoritos" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE" `
  -H "Content-Type: application/json" `
  -d "{`"publicacionId`":$env:PUBLICACION_ID}"
```

## RF_07 - Registro de arrendador

Requiere archivos locales validos.

```powershell
curl.exe -sS -X POST "$env:BASE_URL/auth/register" `
  -F "nombreCompleto=Arrendador Prueba Curls" `
  -F "email=arrendador.curl.$(Get-Random)@example.com" `
  -F "rut=18.222.222-2" `
  -F "password=Arrendador1234." `
  -F "rol=arrendador" `
  -F "telefono=+56 9 1111 2222" `
  -F "terminosAceptados=true" `
  -F "documentoResidencia=@C:\ruta\residencia.pdf;type=application/pdf" `
  -F "fotoPerfil=@C:\ruta\foto.png;type=image/png" `
  -F "documentoVerificacion=@C:\ruta\carnet-frontal.jpg;type=image/jpeg" `
  -F "documentoVerificacionReverso=@C:\ruta\carnet-reverso.jpg;type=image/jpeg"
```

## RF_08 - Crear publicacion

```powershell
curl.exe -sS -X POST "$env:BASE_URL/publicacion" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR" `
  -H "Content-Type: application/json" `
  -d '{"titulo":"Departamento prueba curl","tipoInmueble":"departamento","precioMensual":280000,"ubicacion":"Concepcion centro","fotos":["https://example.com/depto.jpg"],"serviciosIncluidos":["agua","luz","internet"],"reglasConvivencia":"No fumar."}'
```

## RF_09 - Editar y eliminar publicacion

Editar:

```powershell
curl.exe -sS -X PUT "$env:BASE_URL/publicacion/$env:PUBLICACION_ID" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR" `
  -H "Content-Type: application/json" `
  -d '{"precioMensual":290000,"reglasConvivencia":"No fumar. Mantener espacios comunes limpios."}'
```

Eliminar solo sobre datos de prueba:

```powershell
curl.exe -sS -X DELETE "$env:BASE_URL/publicacion/$env:PUBLICACION_ID" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR"
```

## RF_10 - Gestion de mensajes recibidos

```powershell
curl.exe -sS -X GET "$env:BASE_URL/mensajes/conversaciones" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR"
```

Responder conversacion:

```powershell
curl.exe -sS -X POST "$env:BASE_URL/mensajes/conversaciones/1/mensajes" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR" `
  -H "Content-Type: application/json" `
  -d '{"contenido":"Gracias por escribir. Coordinemos una visita."}'
```

## RF_11 - Calificacion de estudiantes

Requiere arriendo completado.

```powershell
curl.exe -sS -X POST "$env:BASE_URL/reviews" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR" `
  -H "Content-Type: application/json" `
  -d "{`"rentalId`":$env:RENTAL_ID,`"targetUserId`":$env:USER_ID_ESTUDIANTE,`"rating`":5,`"comment`":`"Excelente comunicacion y cumplimiento.`"}"
```

## RF_12 - Inicio de sesion administrador

```powershell
curl.exe -sS -X POST "$env:BASE_URL/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"administrador2024@gmail.cl","password":"Admin1234."}'
```

## RF_13 - Revision y aprobacion de documentos

```powershell
curl.exe -sS -X PATCH "$env:BASE_URL/user/detail/verification?id=$env:USER_ID_PENDIENTE" `
  -H "Authorization: Bearer $env:TOKEN_ADMIN" `
  -H "Content-Type: application/json" `
  -d '{"estadoVerificacion":"aprobado","comentarioVerificacion":"Documentos revisados."}'
```

Rechazo:

```powershell
curl.exe -sS -X PATCH "$env:BASE_URL/user/detail/verification?id=$env:USER_ID_PENDIENTE" `
  -H "Authorization: Bearer $env:TOKEN_ADMIN" `
  -H "Content-Type: application/json" `
  -d '{"estadoVerificacion":"rechazado","motivoRechazo":"Documento no legible."}'
```

## RF_14 - Gestion de usuarios

```powershell
curl.exe -sS -X PATCH "$env:BASE_URL/user/detail?id=$env:USER_ID_ESTUDIANTE" `
  -H "Authorization: Bearer $env:TOKEN_ADMIN" `
  -H "Content-Type: application/json" `
  -d '{"nombreCompleto":"Usuario Estudiante Admin"}'
```

Eliminar solo sobre datos de prueba:

```powershell
curl.exe -sS -X DELETE "$env:BASE_URL/user/detail?id=$env:USER_ID_PENDIENTE" `
  -H "Authorization: Bearer $env:TOKEN_ADMIN"
```

## RF_15 - Gestion de publicaciones reportadas

Listar:

```powershell
curl.exe -sS -X GET "$env:BASE_URL/reportes" `
  -H "Authorization: Bearer $env:TOKEN_ADMIN"
```

Resolver:

```powershell
curl.exe -sS -X PATCH "$env:BASE_URL/reportes/$env:PUBLICACION_ID/review" `
  -H "Authorization: Bearer $env:TOKEN_ADMIN" `
  -H "Content-Type: application/json" `
  -d '{"accion":"mantener","observacion":"Reporte revisado sin evidencia suficiente."}'
```

## RF_16 - Visualizacion de usuarios registrados

```powershell
curl.exe -sS -X GET "$env:BASE_URL/user" `
  -H "Authorization: Bearer $env:TOKEN_ADMIN"
```

## RF_17 - Aceptacion de terminos y condiciones

Prueba negativa: debe responder `400`.

```powershell
curl.exe -sS -X POST "$env:BASE_URL/auth/register" `
  -F "nombreCompleto=Estudiante Sin Terminos" `
  -F "email=sin.terminos.$(Get-Random)@example.com" `
  -F "rut=18.333.333-3" `
  -F "password=Estudiante1234." `
  -F "rol=estudiante" `
  -F "universidad=Universidad del Bio Bio" `
  -F "carrera=Ingenieria Civil Informatica" `
  -F "documentoVerificacion=@C:\ruta\certificado.pdf;type=application/pdf" `
  -F "carnetIdentidadFrontal=@C:\ruta\carnet-frontal.jpg;type=image/jpeg" `
  -F "carnetIdentidadReverso=@C:\ruta\carnet-reverso.jpg;type=image/jpeg"
```

## RF_18 - Inicio de conversacion estudiante

```powershell
curl.exe -sS -X POST "$env:BASE_URL/mensajes/contacto" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE" `
  -H "Content-Type: application/json" `
  -d "{`"id_publicacion`":$env:PUBLICACION_ID,`"contenido`":`"Hola, me interesa coordinar una visita.`"}"
```

## RF_19 - Calificacion de arrendador

Requiere arriendo completado.

```powershell
curl.exe -sS -X POST "$env:BASE_URL/reviews" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE" `
  -H "Content-Type: application/json" `
  -d "{`"rentalId`":$env:RENTAL_ID,`"targetUserId`":$env:USER_ID_ARRENDADOR,`"rating`":5,`"comment`":`"Muy buen arrendador.`"}"
```

## RF_20 - Reporte de publicacion

```powershell
curl.exe -sS -X POST "$env:BASE_URL/reportes/publicacion" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE" `
  -H "Content-Type: application/json" `
  -d "{`"id_publicacion`":$env:PUBLICACION_ID,`"motivo`":`"Informacion inconsistente en la publicacion.`"}"
```

## RF_21 - Recuperacion de password

Solicitar recuperacion:

```powershell
curl.exe -sS -X POST "$env:BASE_URL/auth/forgot-password" `
  -H "Content-Type: application/json" `
  -d '{"email":"estudiante1@gmail.cl"}'
```

Restablecer con token real:

```powershell
curl.exe -sS -X POST "$env:BASE_URL/auth/reset-password/<TOKEN_RESET>" `
  -H "Content-Type: application/json" `
  -d '{"newPassword":"NuevaClave1234."}'
```

## RF_22 - Edicion perfil arrendador

```powershell
curl.exe -sS -X PATCH "$env:BASE_URL/profile/arrendador" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR" `
  -H "Content-Type: application/json" `
  -d '{"telefono":"+56 9 2222 3333","nombreCompleto":"Usuario Arrendador Actualizado"}'
```

## RF_23 - Confirmacion de arriendo

Confirmar como estudiante:

```powershell
curl.exe -sS -X POST "$env:BASE_URL/rentals/$env:RENTAL_ID/confirm" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

Confirmar como arrendador:

```powershell
curl.exe -sS -X POST "$env:BASE_URL/rentals/$env:RENTAL_ID/confirm" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR"
```

## RF_24 - Visualizacion de perfil publico

```powershell
curl.exe -sS -X GET "$env:BASE_URL/profile/$env:USER_ID_ARRENDADOR" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_25 - Centro de notificaciones

```powershell
curl.exe -sS -X GET "$env:BASE_URL/notificaciones?limit=20&offset=0" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

Marcar todas como leidas:

```powershell
curl.exe -sS -X PATCH "$env:BASE_URL/notificaciones/leer-todas" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_26 - Notificaciones por correo electronico

Este RF se valida disparando eventos que envian correo, por ejemplo aprobacion, mensaje o arriendo completado. Como evidencia interna:

```powershell
curl.exe -sS -X GET "$env:BASE_URL/notificaciones/count" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_27 - Visualizacion de perfil propio

```powershell
curl.exe -sS -X GET "$env:BASE_URL/profile" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_28 - Listado de publicaciones propias del arrendador

```powershell
curl.exe -sS -X GET "$env:BASE_URL/publicacion/mis-publicaciones" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR"
```

## RF_29 - Historial de arriendos concretados

```powershell
curl.exe -sS -X GET "$env:BASE_URL/rentals" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_30 - Eliminar publicacion de favoritos

```powershell
curl.exe -sS -X DELETE "$env:BASE_URL/favoritos/$env:PUBLICACION_ID" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_31 - Visualizacion de calificaciones recibidas

```powershell
curl.exe -sS -X GET "$env:BASE_URL/reviews/received" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_32 - Mapa interactivo de publicaciones

El mapa se valida visualmente en `/buscar`. El endpoint de datos es:

```powershell
curl.exe -sS -X GET "$env:BASE_URL/publicacion?tipoInmueble=departamento" `
  -H "Authorization: Bearer $env:TOKEN_ESTUDIANTE"
```

## RF_33 - Verificacion de correo electronico

```powershell
curl.exe -sS -X GET "$env:BASE_URL/auth/confirm-email/$env:VERIFICATION_TOKEN"
```

## RF_34 - Estadisticas basicas para arrendadores

Ruta esperada:

```powershell
curl.exe -sS -X GET "$env:BASE_URL/publicacion/$env:PUBLICACION_ID/estadisticas" `
  -H "Authorization: Bearer $env:TOKEN_ARRENDADOR"
```

Observacion: al momento de crear esta guia, la ruta de estadisticas existe como archivo pero no esta montada en `index.routes.js`. Si responde `404`, revisar `backend/src/routes/publicacion.estadisticas.routes.js` antes de declarar fallo funcional.
