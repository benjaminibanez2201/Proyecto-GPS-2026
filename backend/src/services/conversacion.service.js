"use strict";
import Conversacion from "../entity/conversacion.entity.js";
import Publicacion from "../entity/publicacion.entity.js";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";

export async function buscarConversacionPorPublicacionYEstudiante(id_publicacion, id_estudiante) {
  try {
    const repositorioConversacion = AppDataSource.getRepository(Conversacion);

    const conversacion = await repositorioConversacion.findOne({
      where: {
        publicacion: { id: id_publicacion },
        estudiante: { id: id_estudiante },
      },
      relations: ["publicacion", "estudiante", "arrendador"],
    });

    return [conversacion, null];
  } catch (error) {
    console.error("Error buscarConversacionPorPublicacionYEstudiante:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function crearConversacion(id_publicacion, id_estudiante) {
  try {
    const [conversacionGuardada, errorTransaccion] = await AppDataSource.transaction(async (manager) => {
      const repositorioPublicacion = manager.getRepository(Publicacion);
      const repositorioUsuario = manager.getRepository(User);
      const repositorioConversacion = manager.getRepository(Conversacion);

      const publicacion = await repositorioPublicacion.findOne({
        where: { id: id_publicacion },
        relations: ["arrendador"],
      });

      if (!publicacion) return [null, "Publicación no encontrada"];

      const estudiante = await repositorioUsuario.findOneBy({ id: id_estudiante });

      if (!estudiante) return [null, "Estudiante no encontrado"];

      const arrendador = publicacion.arrendador;

      const nuevaConversacion = repositorioConversacion.create({
        publicacion,
        estudiante,
        arrendador,
        ultimaFechaMensaje: new Date(),
      });

      const conversacionCreada = await repositorioConversacion.save(nuevaConversacion);
      await repositorioPublicacion.increment({ id: id_publicacion }, "contadorConversaciones", 1);

      return [conversacionCreada, null];
    });

    if (errorTransaccion) return [null, errorTransaccion];

    return [conversacionGuardada, null];
  } catch (error) {
    console.error("Error crearConversacion:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerConversacionesDeUsuario(usuario) {
  try {
    const repositorioConversacion = AppDataSource.getRepository(Conversacion);
    let conversaciones = [];

    if (usuario.rol === "arrendador") {
      conversaciones = await repositorioConversacion.find({
        where: { arrendador: { id: usuario.id }, ocultadaPorArrendador: false },
        relations: ["publicacion", "estudiante", "arrendador"],
        order: { ultimaFechaMensaje: "DESC" },
      });
    } else {
      conversaciones = await repositorioConversacion.find({
        where: { estudiante: { id: usuario.id }, ocultadaPorEstudiante: false },
        relations: ["publicacion", "estudiante", "arrendador"],
        order: { ultimaFechaMensaje: "DESC" },
      });
    }

    return [conversaciones, null];
  } catch (error) {
    console.error("Error obtenerConversacionesDeUsuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerConversacionPorId(conversacionId) {
  try {
    const repositorioConversacion = AppDataSource.getRepository(Conversacion);

    const conversacion = await repositorioConversacion.findOne({
      where: { id: conversacionId },
      relations: ["publicacion", "estudiante", "arrendador"],
    });

    if (!conversacion) return [null, "Conversación no encontrada"];

    return [conversacion, null];
  } catch (error) {
    console.error("Error obtenerConversacionPorId:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function marcarConversacionLeidaParaUsuario(conversacionId, usuarioId) {
  try {
    const repositorioConversacion = AppDataSource.getRepository(Conversacion);

    const conversacion = await repositorioConversacion.findOne({
      where: { id: conversacionId },
      relations: ["estudiante", "arrendador"],
    });

    if (!conversacion) return [null, "Conversación no encontrada"];

    if (conversacion.arrendador.id === usuarioId) {
      conversacion.noLeidosArrendador = 0;
    }

    if (conversacion.estudiante.id === usuarioId) {
      conversacion.noLeidosEstudiante = 0;
    }

    await repositorioConversacion.save(conversacion);

    return [true, null];
  } catch (error) {
    console.error("Error marcarConversacionLeidaParaUsuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function eliminarConversacionPorUsuario(conversacionId, usuarioId) {
  try {
    const repositorioConversacion = AppDataSource.getRepository(Conversacion);

    const conversacion = await repositorioConversacion.findOne({
      where: { id: conversacionId },
      relations: ["estudiante", "arrendador"],
    });

    if (!conversacion) return [null, "Conversación no encontrada"];

    const esParticipante = Number(conversacion.estudiante?.id) === Number(usuarioId)
      || Number(conversacion.arrendador?.id) === Number(usuarioId);

    if (!esParticipante) return [null, "No tienes permiso para eliminar esta conversación"];

    if (Number(conversacion.arrendador?.id) === Number(usuarioId)) {
      conversacion.ocultadaPorArrendador = true;
    }

    if (Number(conversacion.estudiante?.id) === Number(usuarioId)) {
      conversacion.ocultadaPorEstudiante = true;
    }

    await repositorioConversacion.save(conversacion);
    return [true, null];
  } catch (error) {
    console.error("Error eliminarConversacionPorUsuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export default {
  buscarConversacionPorPublicacionYEstudiante,
  crearConversacion,
  obtenerConversacionesDeUsuario,
  obtenerConversacionPorId,
  marcarConversacionLeidaParaUsuario,
  eliminarConversacionPorUsuario,
};
