"use strict";
import {
  obtenerConversacionesDeUsuario,
  obtenerConversacionPorId,
  marcarConversacionLeidaParaUsuario,
} from "../services/conversacion.service.js";
import {
  enviarMensaje,
  obtenerMensajesPorConversacion,
  marcarMensajesLeidos,
} from "../services/mensaje.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function contactarPublicacion(req, res) {
  try {
    const { id_publicacion, publicationId, contenido } = req.body;
    const publicacionId = id_publicacion ?? publicationId; //revisar
    const remitenteId = req.user.id;

    if (!publicacionId || !contenido) {
      return handleErrorClient(res, 400, "Faltan parámetros");
    }

    const [mensaje, errorMensaje] = await enviarMensaje({
      id_publicacion: Number(publicacionId),
      remitenteId,
      contenido,
    });

    if (errorMensaje) {
      return handleErrorClient(res, 400, "No se pudo enviar el mensaje", errorMensaje);
    }

    handleSuccess(res, 201, "Mensaje enviado", mensaje);
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

    handleSuccess(res, 200, "Conversaciones encontradas", conversaciones);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function obtenerDetalleConversacion(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const [conversacion, errorConversacion] = await obtenerConversacionPorId(Number(id));
    if (errorConversacion) return handleErrorClient(res, 404, errorConversacion);

    if (
      conversacion.estudiante.id !== usuarioId &&
      conversacion.arrendador.id !== usuarioId
    ) {
      return handleErrorClient(res, 403, "No autorizado para ver esta conversación");
    }

    const [mensajes, errorMensajes] = await obtenerMensajesPorConversacion(Number(id));
    if (errorMensajes) return handleErrorServer(res, 500, errorMensajes);

    await marcarMensajesLeidos(Number(id), usuarioId);
    await marcarConversacionLeidaParaUsuario(Number(id), usuarioId);

    handleSuccess(res, 200, "Detalle de conversación", { conversacion, mensajes });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function responderConversacion(req, res) {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const remitenteId = req.user.id;

    if (!contenido) {
      return handleErrorClient(res, 400, "Falta el contenido del mensaje");
    }

    const [conversacion, errorConversacion] = await obtenerConversacionPorId(Number(id));
    if (errorConversacion) return handleErrorClient(res, 404, errorConversacion);

    if (
      conversacion.estudiante.id !== remitenteId &&
      conversacion.arrendador.id !== remitenteId
    ) {
      return handleErrorClient(res, 403, "No autorizado para escribir en esta conversación");
    }

    const [mensaje, errorMensaje] = await enviarMensaje({
      conversacionId: Number(id),
      remitenteId,
      contenido,
    });

    if (errorMensaje) return handleErrorServer(res, 500, errorMensaje);

    handleSuccess(res, 201, "Mensaje enviado", mensaje);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function marcarComoLeido(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const [resultado, errorResultado] = await marcarMensajesLeidos(Number(id), usuarioId);
    if (errorResultado) return handleErrorServer(res, 500, errorResultado);

    await marcarConversacionLeidaParaUsuario(Number(id), usuarioId);

    handleSuccess(res, 200, "Mensajes marcados como leídos", resultado);
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
};
