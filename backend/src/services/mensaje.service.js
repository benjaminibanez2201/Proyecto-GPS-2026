"use strict";
import Mensaje from "../entity/mensaje.entity.js";
import Conversacion from "../entity/conversacion.entity.js";
import { AppDataSource } from "../config/configDb.js";
import {
  createNotificacionService,
  existeNotificacionService,
} from "./notificacion.service.js";
import {
  buscarConversacionPorPublicacionYEstudiante,
  crearConversacion,
} from "./conversacion.service.js";

function getMessageNotificationData(conversacion, remitenteId) {
  const estudianteId = Number(conversacion.estudiante?.id);
  const arrendadorId = Number(conversacion.arrendador?.id);
  const senderId = Number(remitenteId);

  if (senderId === estudianteId) {
    return {
      userId: arrendadorId,
      senderName: conversacion.estudiante?.nombreCompleto || "un estudiante",
      targetId: conversacion.id,
    };
  }

  if (senderId === arrendadorId) {
    return {
      userId: estudianteId,
      senderName: conversacion.arrendador?.nombreCompleto || "un arrendador",
      targetId: conversacion.id,
    };
  }

  return null;
}

export async function enviarMensaje({ conversacionId = null, id_publicacion = null, remitenteId, contenido }) {
  try {
    const repositorioMensaje = AppDataSource.getRepository(Mensaje);
    const repositorioConversacion = AppDataSource.getRepository(Conversacion);

    let conversacion = null;

    if (conversacionId) {
      conversacion = await repositorioConversacion.findOne({
        where: { id: conversacionId },
        relations: ["estudiante", "arrendador"],
      });

      if (!conversacion) return [null, "Conversación no encontrada"];
    } else if (id_publicacion) {
      const [conversacionEncontrada, errorConversacion] =
        await buscarConversacionPorPublicacionYEstudiante(id_publicacion, remitenteId);

      if (errorConversacion) return [null, errorConversacion];

      if (conversacionEncontrada) {
        conversacion = conversacionEncontrada;
      } else {
        const [conversacionCreada, errorCreacion] = await crearConversacion(
          id_publicacion,
          remitenteId,
        );

        if (errorCreacion) return [null, errorCreacion];
        conversacion = conversacionCreada;
      }
    } else {
      return [null, "Faltan parámetros para crear el mensaje"];
    }

    const nuevoMensaje = repositorioMensaje.create({
      contenido,
      conversacion,
      remitente: { id: remitenteId },
    });

    const mensajeGuardado = await repositorioMensaje.save(nuevoMensaje);

    conversacion.ultimaFechaMensaje = new Date();
    const notificationData = getMessageNotificationData(
      conversacion,
      remitenteId,
    );

    if (conversacion.estudiante && conversacion.estudiante.id === remitenteId) {
      conversacion.noLeidosArrendador = (conversacion.noLeidosArrendador || 0) + 1;
    } else {
      conversacion.noLeidosEstudiante = (conversacion.noLeidosEstudiante || 0) + 1;
    }

    await repositorioConversacion.save(conversacion);

    if (notificationData?.userId) {
      try {
        const notificationPayload = {
          userId: notificationData.userId,
          tipo: "MESSAGE_RECEIVED",
          mensaje: `Recibiste un nuevo mensaje de ${notificationData.senderName}`,
          targetType: "conversation",
          targetId: notificationData.targetId,
        };

        const [notificacionExistente, errorVerificacion] = await existeNotificacionService({
          userId: notificationPayload.userId,
          tipo: notificationPayload.tipo,
          targetType: notificationPayload.targetType,
          targetId: notificationPayload.targetId,
        });

        if (errorVerificacion) throw new Error(errorVerificacion);
        if (!notificacionExistente) await createNotificacionService(notificationPayload);
      } catch (notifError) {
        console.error("Error creando notificaciÃ³n de mensaje:", notifError);
      }
    }

    return [mensajeGuardado, null];
  } catch (error) {
    console.error("Error enviarMensaje:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerMensajesPorConversacion(conversacionId) {
  try {
    const repositorioMensaje = AppDataSource.getRepository(Mensaje);

    const mensajes = await repositorioMensaje.find({
      where: { conversacion: { id: conversacionId } },
      relations: ["remitente"],
      order: { createdAt: "ASC" },
    });

    return [mensajes, null];
  } catch (error) {
    console.error("Error obtenerMensajesPorConversacion:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function marcarMensajesLeidos(conversacionId, usuarioId) {
  try {
    const repositorioMensaje = AppDataSource.getRepository(Mensaje);
    const repositorioConversacion = AppDataSource.getRepository(Conversacion);

    const conversacion = await repositorioConversacion.findOne({
      where: { id: conversacionId },
      relations: ["estudiante", "arrendador"],
    });

    if (!conversacion) return [null, "Conversación no encontrada"];

    const mensajes = await repositorioMensaje.find({
      where: { conversacion: { id: conversacionId }, leido: false },
      relations: ["remitente"],
    });

    const mensajesParaActualizar = mensajes.filter(
      (mensaje) => mensaje.remitente.id !== usuarioId,
    );

    for (const mensaje of mensajesParaActualizar) {
      mensaje.leido = true;
      await repositorioMensaje.save(mensaje);
    }

    if (conversacion.arrendador.id === usuarioId) {
      conversacion.noLeidosArrendador = 0;
    }

    if (conversacion.estudiante.id === usuarioId) {
      conversacion.noLeidosEstudiante = 0;
    }

    await repositorioConversacion.save(conversacion);

    return [true, null];
  } catch (error) {
    console.error("Error marcarMensajesLeidos:", error);
    return [null, "Error interno del servidor"];
  }
}

export default { enviarMensaje, obtenerMensajesPorConversacion, marcarMensajesLeidos };
