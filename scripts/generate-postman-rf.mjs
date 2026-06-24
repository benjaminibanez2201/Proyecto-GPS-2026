import fs from "node:fs";
import path from "node:path";

const collectionPath = path.resolve("postman/ArriendU_RF_Testing.postman_collection.json");
const environmentPath = path.resolve("postman/ArriendU_Local.postman_environment.json");

const baseHeaders = [{ key: "Content-Type", value: "application/json" }];
const authHeaders = (tokenVariable) => [
  { key: "Authorization", value: `Bearer {{${tokenVariable}}}` },
];

function jsonBody(data) {
  return {
    mode: "raw",
    raw: JSON.stringify(data, null, 2),
    options: { raw: { language: "json" } },
  };
}

function formData(fields) {
  return {
    mode: "formdata",
    formdata: fields.map((field) => ({
      key: field.key,
      type: field.type || "text",
      value: field.value,
      src: field.src || [],
    })),
  };
}

function buildPostmanUrl(routePath) {
  const [pathname, queryString] = routePath.split("?");
  const normalizedPath = pathname.replace(/^\/+/, "");

  const url = {
    raw: `{{baseUrl}}${routePath}`,
    host: ["{{baseUrl}}"],
    path: normalizedPath ? normalizedPath.split("/") : [],
  };

  if (queryString) {
    url.query = queryString
      .split("&")
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        if (separatorIndex === -1) {
          return { key: part, value: "" };
        }

        return {
          key: part.slice(0, separatorIndex),
          value: part.slice(separatorIndex + 1),
        };
      });
  }

  return url;
}

function singleQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function curlForRequest({ method, path: routePath, headers = baseHeaders, body }) {
  const lines = [`curl --location --request ${method} ${singleQuote(`{{baseUrl}}${routePath}`)}`];

  for (const header of headers) {
    lines.push(`  --header ${singleQuote(`${header.key}: ${header.value}`)}`);
  }

  if (body?.mode === "raw") {
    lines.push(`  --data-raw ${singleQuote(body.raw)}`);
  }

  if (body?.mode === "formdata") {
    for (const field of body.formdata) {
      const value = field.type === "file"
        ? `@/ruta/local/${field.key}`
        : field.value;
      lines.push(`  --form ${singleQuote(`${field.key}=${value}`)}`);
    }
  }

  return lines.join(" \\\n");
}

function descriptionWithCurl({ description, method, path, headers, body }) {
  return [
    description,
    "",
    "cURL equivalente:",
    "```bash",
    curlForRequest({ method, path, headers, body }),
    "```",
  ].join("\n");
}

function testScript({ expected = [200, 201, 204], tokenTarget }) {
  const lines = [
    `pm.test("status esperado (${expected.join(", ")})", function () {`,
    `  pm.expect(${JSON.stringify(expected)}).to.include(pm.response.code);`,
    "});",
    "let responseBody = {};",
    "try { responseBody = pm.response.json(); } catch (error) {}",
  ];

  if (tokenTarget) {
    lines.push(
      "const token = responseBody?.data?.token || responseBody?.data?.accessToken || responseBody?.token;",
      `if (token) pm.environment.set("${tokenTarget}", token);`,
    );
  }

  return [{ listen: "test", script: { type: "text/javascript", exec: lines } }];
}

function request({
  name,
  description,
  method,
  path,
  headers = baseHeaders,
  body,
  expected,
  tokenTarget,
}) {
  return {
    name,
    event: testScript({ expected, tokenTarget }),
    request: {
      method,
      header: headers,
      description: descriptionWithCurl({ description, method, path, headers, body }),
      url: buildPostmanUrl(path),
      ...(body ? { body } : {}),
    },
  };
}

const authFolder = {
  name: "00 - Login y tokens base",
  item: [
    request({
      name: "Login administrador",
      description: "Obtiene token admin semilla para RF_12, RF_13, RF_14, RF_15 y RF_16.",
      method: "POST",
      path: "/auth/login",
      body: jsonBody({ email: "{{adminEmail}}", password: "{{adminPassword}}" }),
      tokenTarget: "tokenAdmin",
    }),
    request({
      name: "Login estudiante",
      description: "Obtiene token estudiante semilla para busqueda, favoritos, reportes, arriendos y resenas.",
      method: "POST",
      path: "/auth/login",
      body: jsonBody({ email: "{{estudianteEmail}}", password: "{{estudiantePassword}}" }),
      tokenTarget: "tokenEstudiante",
    }),
    request({
      name: "Login arrendador",
      description: "Obtiene token arrendador semilla para publicaciones, arriendos y resenas.",
      method: "POST",
      path: "/auth/login",
      body: jsonBody({ email: "{{arrendadorEmail}}", password: "{{arrendadorPassword}}" }),
      tokenTarget: "tokenArrendador",
    }),
  ],
};

const rfItems = [
  request({
    name: "RF_01 - Registro de estudiante",
    description: "Registro multipart de estudiante. Elegir archivos locales validos antes de enviar.",
    method: "POST",
    path: "/auth/register",
    headers: [],
    body: formData([
      { key: "nombreCompleto", value: "Estudiante Prueba Automatizada" },
      { key: "email", value: "{{emailEstudianteNuevo}}" },
      { key: "rut", value: "{{rutEstudianteNuevo}}" },
      { key: "password", value: "Estudiante1234." },
      { key: "rol", value: "estudiante" },
      { key: "universidad", value: "Universidad del Bio Bio" },
      { key: "carrera", value: "Ingenieria Civil Informatica" },
      { key: "terminosAceptados", value: "true" },
      { key: "documentoVerificacion", type: "file" },
      { key: "carnetIdentidadFrontal", type: "file" },
      { key: "carnetIdentidadReverso", type: "file" },
    ]),
  }),
  request({
    name: "RF_02 - Login estudiante/arrendador",
    description: "Valida credenciales y cuenta aprobada/verificada.",
    method: "POST",
    path: "/auth/login",
    body: jsonBody({ email: "{{estudianteEmail}}", password: "{{estudiantePassword}}" }),
    tokenTarget: "tokenEstudiante",
  }),
  request({
    name: "RF_03 - Edicion perfil estudiante",
    description: "Edita datos publicos del perfil de estudiante autenticado.",
    method: "PATCH",
    path: "/profile",
    headers: authHeaders("tokenEstudiante").concat(baseHeaders),
    body: jsonBody({
      nombreCompleto: "Usuario Estudiante Actualizado",
      universidad: "Universidad del Bio Bio",
      carrera: "Ingenieria Civil Informatica",
    }),
  }),
  request({
    name: "RF_04 - Busqueda de publicaciones",
    description: "Busca publicaciones activas con filtros disponibles en backend.",
    method: "GET",
    path: "/publicacion?precioMax={{precioMax}}&tipoInmueble=departamento&ordenarPor=precioMensual&direccionOrden=ASC",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_05 - Detalle de publicacion",
    description: "Obtiene detalle publico de una publicacion.",
    method: "GET",
    path: "/publicacion/{{publicacionId}}",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_06 - Guardar favorito",
    description: "Guarda una publicacion como favorita del estudiante.",
    method: "POST",
    path: "/favoritos",
    headers: authHeaders("tokenEstudiante").concat(baseHeaders),
    body: jsonBody({ publicacionId: "{{publicacionId}}" }),
  }),
  request({
    name: "RF_07 - Registro de arrendador",
    description: "Registro multipart de arrendador. Elegir archivos locales validos antes de enviar.",
    method: "POST",
    path: "/auth/register",
    headers: [],
    body: formData([
      { key: "nombreCompleto", value: "Arrendador Prueba Automatizada" },
      { key: "email", value: "{{emailArrendadorNuevo}}" },
      { key: "rut", value: "{{rutArrendadorNuevo}}" },
      { key: "password", value: "Arrendador1234." },
      { key: "rol", value: "arrendador" },
      { key: "telefono", value: "+56 9 1111 2222" },
      { key: "terminosAceptados", value: "true" },
      { key: "documentoResidencia", type: "file" },
      { key: "fotoPerfil", type: "file" },
      { key: "documentoVerificacion", type: "file" },
      { key: "documentoVerificacionReverso", type: "file" },
    ]),
  }),
  request({
    name: "RF_08 - Crear publicacion",
    description: "Crea publicacion como arrendador aprobado.",
    method: "POST",
    path: "/publicacion",
    headers: authHeaders("tokenArrendador").concat(baseHeaders),
    body: jsonBody({
      titulo: "Departamento prueba Postman",
      tipoInmueble: "departamento",
      precioMensual: 280000,
      ubicacion: "Concepcion centro",
      fotos: ["https://example.com/depto.jpg"],
      serviciosIncluidos: ["agua", "luz", "internet"],
      reglasConvivencia: "No fumar.",
    }),
  }),
  request({
    name: "RF_09 - Editar publicacion",
    description: "Actualiza una publicacion propia del arrendador.",
    method: "PUT",
    path: "/publicacion/{{publicacionId}}",
    headers: authHeaders("tokenArrendador").concat(baseHeaders),
    body: jsonBody({ precioMensual: 290000, reglasConvivencia: "No fumar. Mantener espacios comunes limpios." }),
  }),
  request({
    name: "RF_10 - Bandeja de mensajes",
    description: "Lista conversaciones del usuario autenticado.",
    method: "GET",
    path: "/mensajes/conversaciones",
    headers: authHeaders("tokenArrendador"),
  }),
  request({
    name: "RF_11 - Calificar estudiante",
    description: "Arrendador califica a estudiante tras arriendo completado.",
    method: "POST",
    path: "/reviews",
    headers: authHeaders("tokenArrendador").concat(baseHeaders),
    body: jsonBody({
      rentalId: "{{rentalId}}",
      targetUserId: "{{userIdEstudiante}}",
      rating: 5,
      comment: "Excelente comunicacion y cumplimiento.",
    }),
  }),
  request({
    name: "RF_12 - Login administrador",
    description: "Valida credenciales del admin semilla.",
    method: "POST",
    path: "/auth/login",
    body: jsonBody({ email: "{{adminEmail}}", password: "{{adminPassword}}" }),
    tokenTarget: "tokenAdmin",
  }),
  request({
    name: "RF_13 - Aprobar/rechazar verificacion",
    description: "Actualiza estado de verificacion de un usuario.",
    method: "PATCH",
    path: "/user/detail/verification?id={{userIdPendiente}}",
    headers: authHeaders("tokenAdmin").concat(baseHeaders),
    body: jsonBody({ estadoVerificacion: "aprobado", comentarioVerificacion: "Documentos revisados." }),
  }),
  request({
    name: "RF_14 - Gestion de usuario",
    description: "Edita un usuario desde administracion.",
    method: "PATCH",
    path: "/user/detail?id={{userIdEstudiante}}",
    headers: authHeaders("tokenAdmin").concat(baseHeaders),
    body: jsonBody({ nombreCompleto: "Usuario Estudiante Admin" }),
  }),
  request({
    name: "RF_15 - Listar reportes",
    description: "Admin lista publicaciones reportadas pendientes.",
    method: "GET",
    path: "/reportes",
    headers: authHeaders("tokenAdmin"),
  }),
  request({
    name: "RF_16 - Listar usuarios registrados",
    description: "Admin obtiene listado completo sin password.",
    method: "GET",
    path: "/user",
    headers: authHeaders("tokenAdmin"),
  }),
  request({
    name: "RF_17 - Registro sin terminos",
    description: "Prueba negativa: el registro debe fallar si no acepta terminos.",
    method: "POST",
    path: "/auth/register",
    headers: [],
    expected: [400],
    body: formData([
      { key: "nombreCompleto", value: "Estudiante Sin Terminos" },
      { key: "email", value: "{{emailSinTerminos}}" },
      { key: "rut", value: "{{rutSinTerminos}}" },
      { key: "password", value: "Estudiante1234." },
      { key: "rol", value: "estudiante" },
      { key: "universidad", value: "Universidad del Bio Bio" },
      { key: "carrera", value: "Ingenieria Civil Informatica" },
      { key: "documentoVerificacion", type: "file" },
      { key: "carnetIdentidadFrontal", type: "file" },
      { key: "carnetIdentidadReverso", type: "file" },
    ]),
  }),
  request({
    name: "RF_18 - Iniciar conversacion",
    description: "Estudiante contacta al arrendador desde una publicacion.",
    method: "POST",
    path: "/mensajes/contacto",
    headers: authHeaders("tokenEstudiante").concat(baseHeaders),
    body: jsonBody({ id_publicacion: "{{publicacionId}}", contenido: "Hola, me interesa coordinar una visita." }),
  }),
  request({
    name: "RF_19 - Calificar arrendador",
    description: "Estudiante califica a arrendador tras arriendo completado.",
    method: "POST",
    path: "/reviews",
    headers: authHeaders("tokenEstudiante").concat(baseHeaders),
    body: jsonBody({
      rentalId: "{{rentalId}}",
      targetUserId: "{{userIdArrendador}}",
      rating: 5,
      comment: "Muy buen arrendador.",
    }),
  }),
  request({
    name: "RF_20 - Reportar publicacion",
    description: "Estudiante reporta una publicacion sospechosa.",
    method: "POST",
    path: "/reportes/publicacion",
    headers: authHeaders("tokenEstudiante").concat(baseHeaders),
    body: jsonBody({ id_publicacion: "{{publicacionId}}", motivo: "Informacion inconsistente en la publicacion." }),
  }),
  request({
    name: "RF_21 - Solicitar recuperacion password",
    description: "Envia correo de recuperacion si la cuenta existe.",
    method: "POST",
    path: "/auth/forgot-password",
    body: jsonBody({ email: "{{estudianteEmail}}" }),
  }),
  request({
    name: "RF_22 - Editar perfil arrendador",
    description: "Actualiza datos publicos de arrendador.",
    method: "PATCH",
    path: "/profile/arrendador",
    headers: authHeaders("tokenArrendador").concat(baseHeaders),
    body: jsonBody({ telefono: "+56 9 2222 3333", nombreCompleto: "Usuario Arrendador Actualizado" }),
  }),
  request({
    name: "RF_23 - Confirmar arriendo",
    description: "Confirma arriendo como participante; repetir con la otra parte para completarlo.",
    method: "POST",
    path: "/rentals/{{rentalId}}/confirm",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_24 - Ver perfil publico",
    description: "Obtiene perfil publico de otro usuario autenticado.",
    method: "GET",
    path: "/profile/{{userIdArrendador}}",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_25 - Centro de notificaciones",
    description: "Lista notificaciones propias ordenadas por fecha.",
    method: "GET",
    path: "/notificaciones?limit=20&offset=0",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_26 - Notificacion por correo",
    description: "Evidencia indirecta: eventos como aprobacion, mensaje o arriendo completado disparan email y notificacion interna.",
    method: "GET",
    path: "/notificaciones/count",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_27 - Perfil propio",
    description: "Obtiene el perfil del usuario autenticado.",
    method: "GET",
    path: "/profile",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_28 - Mis publicaciones",
    description: "Arrendador lista solo sus publicaciones.",
    method: "GET",
    path: "/publicacion/mis-publicaciones",
    headers: authHeaders("tokenArrendador"),
  }),
  request({
    name: "RF_29 - Historial arriendos",
    description: "Lista arriendos propios e indica si se puede calificar.",
    method: "GET",
    path: "/rentals",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_30 - Eliminar favorito",
    description: "Elimina una publicacion de favoritos sin afectar la publicacion original.",
    method: "DELETE",
    path: "/favoritos/{{publicacionId}}",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_31 - Calificaciones recibidas",
    description: "Lista resenas recibidas por el usuario autenticado.",
    method: "GET",
    path: "/reviews/received",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_32 - Mapa interactivo",
    description: "API base para alimentar mapa: devuelve publicaciones con ubicacion; validacion visual se hace en frontend.",
    method: "GET",
    path: "/publicacion?tipoInmueble=departamento",
    headers: authHeaders("tokenEstudiante"),
  }),
  request({
    name: "RF_33 - Confirmar correo",
    description: "Pegar token recibido por correo en la variable verificationToken.",
    method: "GET",
    path: "/auth/confirm-email/{{verificationToken}}",
    headers: [],
  }),
  request({
    name: "RF_34 - Estadisticas publicacion",
    description: "Ruta esperada para estadisticas. Revisar observaciones: actualmente puede no estar montada o no coincidir con entidad.",
    method: "GET",
    path: "/publicacion/{{publicacionId}}/estadisticas",
    headers: authHeaders("tokenArrendador"),
    expected: [200, 404],
  }),
];

const collection = {
  info: {
    name: "ArriendU - Pruebas RF Completa",
    description: [
      "Coleccion Postman para validar RF_01 a RF_34 de ArriendU.",
      "Importar junto con ArriendU_Local.postman_environment.json.",
      "Ejecutar primero la carpeta 00 - Login y tokens base.",
      "Cada request incluye URL estructurada, headers, body y cURL equivalente en la descripcion.",
      "Algunas pruebas requieren variables creadas previamente o archivos locales.",
    ].join("\n"),
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: [
    authFolder,
    {
      name: "01 - Cobertura RF_01 a RF_34",
      item: rfItems,
    },
  ],
};

const environment = {
  name: "ArriendU Local",
  values: [
    ["baseUrl", "http://localhost:3000/api"],
    ["adminEmail", "administrador2024@gmail.cl"],
    ["adminPassword", "Admin1234."],
    ["estudianteEmail", "estudiante1@gmail.cl"],
    ["estudiantePassword", "Estudiante1234."],
    ["arrendadorEmail", "arrendador1@gmail.cl"],
    ["arrendadorPassword", "Arrendador1234."],
    ["tokenAdmin", ""],
    ["tokenEstudiante", ""],
    ["tokenArrendador", ""],
    ["userIdEstudiante", "2"],
    ["userIdArrendador", "3"],
    ["userIdPendiente", "4"],
    ["publicacionId", "1"],
    ["rentalId", "1"],
    ["reviewId", "1"],
    ["reporteId", "1"],
    ["notificacionId", "1"],
    ["verificationToken", "pegar-token-del-correo"],
    ["precioMax", "350000"],
    ["emailEstudianteNuevo", "estudiante.rf.postman@example.com"],
    ["emailArrendadorNuevo", "arrendador.rf.postman@example.com"],
    ["emailSinTerminos", "sin.terminos.rf@example.com"],
    ["rutEstudianteNuevo", "18.111.111-1"],
    ["rutArrendadorNuevo", "18.222.222-2"],
    ["rutSinTerminos", "18.333.333-3"],
  ].map(([key, value]) => ({ key, value, enabled: true, type: "default" })),
};

fs.mkdirSync(path.dirname(collectionPath), { recursive: true });
fs.writeFileSync(collectionPath, `${JSON.stringify(collection, null, 2)}\n`);
fs.writeFileSync(environmentPath, `${JSON.stringify(environment, null, 2)}\n`);

console.log(`Generated ${collectionPath}`);
console.log(`Generated ${environmentPath}`);
