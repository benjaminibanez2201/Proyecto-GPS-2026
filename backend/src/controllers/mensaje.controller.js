"use strict";
import {
  eliminarConversacionPorUsuario,
  marcarConversacionLeidaParaUsuario,
  obtenerConversacionesDeUsuario,
  obtenerConversacionPorId,
} from "../services/conversacion.service.js";
import {
  enviarMensaje,
  marcarMensajesLeidos,
  obtenerMensajesPorConversacion,
} from "../services/mensaje.service.js";
import { marcarNotificacionesPorTargetLeidasService } from "../services/notificacion.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { isValidPublicId } from "../helpers/publicId.helper.js";

function agregarPublicIdConversacion(conversacion) {
  if (!conversacion) return conversacion;

  const resultado = { ...conversacion, publicId: conversacion.uuid };

  if (conversacion.publicacion) {
    resultado.publicacion = { ...conversacion.publicacion, publicId: conversacion.publicacion.uuid };
  }

  if (conversacion.estudiante) {
    resultado.estudiante = { ...conversacion.estudiante, publicId: conversacion.estudiante.uuid };
  }

  if (conversacion.arrendador) {
    resultado.arrendador = { ...conversacion.arrendador, publicId: conversacion.arrendador.uuid };
  }

  return resultado;
}

export async function contactarPublicacion(req, res) {
  try {
    const { id_publicacion, contenido } = req.body;
    const remitenteId = req.user.id;

    if (!isValidPublicId(id_publicacion) || !contenido) {
      return handleErrorClient(res, 400, "Faltan parámetros");
    }

    const [mensaje, errorMensaje] = await enviarMensaje({
      id_publicacion,
      remitenteId,
      contenido,
    });

    if (errorMensaje) {
      return handleErrorClient(res, 400, "No se pudo enviar el mensaje", errorMensaje);
    }

    const mensajeConPublicId = mensaje?.conversacion
      ? { ...mensaje, conversacion: agregarPublicIdConversacion(mensaje.conversacion) }
      : mensaje;

    handleSuccess(res, 201, "Mensaje enviado", mensajeConPublicId);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function listarConversaciones(req, res) {
  try {
    const usuario = req.user;

    const [conversaciones, errorConversaciones] =
      await obtenerConversacionesDeUsuario(usuario);

    if (errorConversaciones) {
      return handleErrorServer(res, 500, errorConversaciones);
    }

    handleSuccess(res, 200, "Conversaciones encontradas", conversaciones.map(agregarPublicIdConversacion));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function obtenerDetalleConversacion(req, res) {
  try {
    const { id: conversacionUuid } = req.params;
    const usuarioId = req.user.id;

    if (!isValidPublicId(conversacionUuid)) {
      return handleErrorClient(res, 400, "ID inválido", "El identificador de la conversación no es válido");
    }

    const [conversacion, errorConversacion] = await obtenerConversacionPorId(conversacionUuid);
    if (errorConversacion) return handleErrorClient(res, 404, errorConversacion);

    if (
      conversacion.estudiante.id !== usuarioId
      && conversacion.arrendador.id !== usuarioId
    ) {
      return handleErrorClient(res, 403, "No autorizado para ver esta conversación");
    }

    const id = conversacion.id;

    const [mensajes, errorMensajes] = await obtenerMensajesPorConversacion(id);
    if (errorMensajes) return handleErrorServer(res, 500, errorMensajes);

    await marcarMensajesLeidos(id, usuarioId);
    await marcarConversacionLeidaParaUsuario(id, usuarioId);
    await marcarNotificacionesPorTargetLeidasService(usuarioId, "conversation", id);

    handleSuccess(res, 200, "Detalle de conversación", {
      conversacion: agregarPublicIdConversacion(conversacion),
      mensajes,
    });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function responderConversacion(req, res) {
  try {
    const { id: conversacionUuid } = req.params;
    const { contenido } = req.body;
    const remitenteId = req.user.id;

    if (!isValidPublicId(conversacionUuid)) {
      return handleErrorClient(res, 400, "ID inválido", "El identificador de la conversación no es válido");
    }

    if (!contenido) {
      return handleErrorClient(res, 400, "Falta el contenido del mensaje");
    }

    const [conversacion, errorConversacion] = await obtenerConversacionPorId(conversacionUuid);
    if (errorConversacion) return handleErrorClient(res, 404, errorConversacion);

    if (
      conversacion.estudiante.id !== remitenteId
      && conversacion.arrendador.id !== remitenteId
    ) {
      return handleErrorClient(res, 403, "No autorizado para escribir en esta conversación");
    }

    const [mensaje, errorMensaje] = await enviarMensaje({
      conversacionId: conversacion.id,
      remitenteId,
      contenido,
    });

    if (errorMensaje) return handleErrorServer(res, 500, errorMensaje);

    const mensajeConPublicId = mensaje?.conversacion
      ? { ...mensaje, conversacion: agregarPublicIdConversacion(mensaje.conversacion) }
      : mensaje;

    handleSuccess(res, 201, "Mensaje enviado", mensajeConPublicId);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function marcarComoLeido(req, res) {
  try {
    const { id: conversacionUuid } = req.params;
    const usuarioId = req.user.id;

    if (!isValidPublicId(conversacionUuid)) {
      return handleErrorClient(res, 400, "ID inválido", "El identificador de la conversación no es válido");
    }

    const [conversacion, errorConversacion] = await obtenerConversacionPorId(conversacionUuid);
    if (errorConversacion) return handleErrorClient(res, 404, errorConversacion);

    const id = conversacion.id;

    const [resultado, errorResultado] = await marcarMensajesLeidos(id, usuarioId);
    if (errorResultado) return handleErrorServer(res, 500, errorResultado);

    await marcarConversacionLeidaParaUsuario(id, usuarioId);
    await marcarNotificacionesPorTargetLeidasService(usuarioId, "conversation", id);

    handleSuccess(res, 200, "Mensajes marcados como leídos", resultado);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function eliminarConversacion(req, res) {
  try {
    const { id: conversacionUuid } = req.params;
    const usuarioId = req.user.id;

    if (!isValidPublicId(conversacionUuid)) {
      return handleErrorClient(res, 400, "ID inválido", "El identificador de la conversación no es válido");
    }

    const [conversacion, errorConversacion] = await obtenerConversacionPorId(conversacionUuid);
    if (errorConversacion) return handleErrorClient(res, 404, errorConversacion);

    const [resultado, errorResultado] = await eliminarConversacionPorUsuario(conversacion.id, usuarioId);
    if (errorResultado === "Conversación no encontrada") {
      return handleErrorClient(res, 404, errorResultado);
    }

    if (errorResultado === "No tienes permiso para eliminar esta conversación") {
      return handleErrorClient(res, 403, errorResultado);
    }

    if (errorResultado) return handleErrorServer(res, 500, errorResultado);

    handleSuccess(res, 200, "Conversación ocultada correctamente", resultado);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export default {
  contactarPublicacion,
  listarConversaciones,
  obtenerDetalleConversacion,
  responderConversacion,
  marcarComoLeido,
  eliminarConversacion,
};
