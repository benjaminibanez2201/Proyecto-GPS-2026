"use strict";
import Mensaje from "../entity/mensaje.entity.js";
import Conversacion from "../entity/conversacion.entity.js";
import { AppDataSource } from "../config/configDb.js";
import {
  buscarConversacionPorPublicacionYEstudiante,
  crearConversacion,
} from "./conversacion.service.js";

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
    if (conversacion.estudiante && conversacion.estudiante.id === remitenteId) {
      conversacion.noLeidosArrendador = (conversacion.noLeidosArrendador || 0) + 1;
    } else {
      conversacion.noLeidosEstudiante = (conversacion.noLeidosEstudiante || 0) + 1;
    }

    await repositorioConversacion.save(conversacion);

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
