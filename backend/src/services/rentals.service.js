"use strict";
import Rental from "../entity/rental.entity.js";
import Review from "../entity/review.entity.js";
import Conversacion from "../entity/conversacion.entity.js";
import Publicacion from "../entity/publicacion.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { In, Not } from "typeorm";
import { sendRentalCompleteEmail } from "./email.service.js";
import { createNotificacionService } from "./notificacion.service.js";

export async function crearArriendoServicio(body, callerUserId) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);
    const repositorioPublicacion = AppDataSource.getRepository(Publicacion);
    const repositorioConversacion = AppDataSource.getRepository(Conversacion);

    if (!body?.arrendadorId || !body?.estudianteId || !body?.publicacionId) {
      return [null, "Faltan datos para crear el arriendo"];
    }

    const esArrendador = Number(callerUserId) === Number(body.arrendadorId);
    const esEstudiante = Number(callerUserId) === Number(body.estudianteId);
    if (!esArrendador && !esEstudiante) {
      return [null, "No eres parte de este arriendo"];
    }

    const publicacion = await repositorioPublicacion.findOne({ where: { id: Number(body.publicacionId) } });
    if (!publicacion) return [null, "Publicación no encontrada"];
    if (publicacion.estado === "arrendada") return [null, "La publicación ya está arrendada"];
    if (publicacion.estado !== "activa") return [null, "La publicación no está activa"];

    const conversacionExistente = await repositorioConversacion.findOne({
      where: {
        publicacion: { id: Number(body.publicacionId) },
        estudiante: { id: Number(body.estudianteId) },
        arrendador: { id: Number(body.arrendadorId) },
      },
      relations: ["publicacion", "estudiante", "arrendador"],
    });

    if (!conversacionExistente) {
      return [null, "Debes haber iniciado un contacto en la mensajería para aceptar el arriendo"];
    }

    let arriendo = await repositorioArriendo.findOne({
      where: {
        arrendadorId: Number(body.arrendadorId),
        estudianteId: Number(body.estudianteId),
        publicacionId: Number(body.publicacionId),
        status: Not("FINISHED"),
      },
      order: { createdAt: "DESC" },
    });

    if (arriendo?.status === "COMPLETED") {
      const yaCompletado = await repositorioArriendo.findOne({
        where: { id: arriendo.id },
        relations: { arrendador: true, estudiante: true },
      });
      return [yaCompletado, null];
    }

    if (!arriendo) {
      const nuevoArriendo = repositorioArriendo.create({
        arrendadorId: Number(body.arrendadorId),
        estudianteId: Number(body.estudianteId),
        publicacionId: Number(body.publicacionId),
        status: "PENDING",
      });
      arriendo = await repositorioArriendo.save(nuevoArriendo);
    }

    const actualizacionFlags = {};
    if (esArrendador) actualizacionFlags.confirmedByArrendador = true;
    if (esEstudiante) actualizacionFlags.confirmedByEstudiante = true;
    await repositorioArriendo.update({ id: arriendo.id }, actualizacionFlags);

    let actualizado = await repositorioArriendo.findOne({
      where: { id: arriendo.id },
      relations: { arrendador: true, estudiante: true },
    });

    if (actualizado.confirmedByArrendador && actualizado.confirmedByEstudiante) {
      await repositorioArriendo.update(
        { id: arriendo.id },
        { status: "COMPLETED", completedAt: new Date() },
      );
      await repositorioPublicacion.update({ id: publicacion.id }, { estado: "arrendada" });

      actualizado = await repositorioArriendo.findOne({
        where: { id: arriendo.id },
        relations: { arrendador: true, estudiante: true },
      });

      try {
        await createNotificacionService({
          userId: actualizado.arrendador.id,
          tipo: "RENTAL_COMPLETED",
          mensaje: "El arriendo ha sido aceptado por ambas partes",
          targetType: "rental",
          targetId: actualizado.id,
        });
        await createNotificacionService({
          userId: actualizado.estudiante.id,
          tipo: "RENTAL_COMPLETED",
          mensaje: "El arriendo ha sido aceptado por ambas partes",
          targetType: "rental",
          targetId: actualizado.id,
        });
      } catch (notifError) {
        console.error("Error creando notificaciones de arriendo aceptado:", notifError);
      }

      try {
        await sendRentalCompleteEmail(actualizado);
      } catch (emailError) {
        console.error("Error enviando correo de arriendo aceptado:", emailError);
      }
    } else {
      try {
        const otroUserId = esArrendador ? actualizado.estudiante.id : actualizado.arrendador.id;
        await createNotificacionService({
          userId: otroUserId,
          tipo: "RENTAL_PENDING_CONFIRMATION",
          mensaje: "La otra parte aceptó el arriendo, falta tu confirmación",
          targetType: "rental",
          targetId: actualizado.id,
        });
      } catch (notifError) {
        console.error("Error creando notificación de confirmación pendiente:", notifError);
      }
    }

    return [actualizado, null];
  } catch (error) {
    console.error("Error crearArriendoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerArriendoPorIdServicio(uuid) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);

    const arriendo = await repositorioArriendo.findOne({
      where: { uuid },
      relations: {
        arrendador: true,
        estudiante: true,
        publicacion: true,
      },
    });

    if (!arriendo) return [null, "Arriendo no encontrado"];

    return [arriendo, null];
  } catch (error) {
    console.error("Error obtenerArriendoPorIdServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function finalizarArriendoPorPublicacionServicio(publicacionUuid, arrendadorId) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);
    const repositorioPublicacion = AppDataSource.getRepository(Publicacion);

    const publicacion = await repositorioPublicacion.findOneBy({ uuid: publicacionUuid });
    if (!publicacion) return [null, "La publicación no existe"];

    const arriendo = await repositorioArriendo.findOne({
      where: {
        publicacionId: publicacion.id,
        arrendadorId: Number(arrendadorId),
        status: "COMPLETED",
      },
    });

    if (!arriendo) return [null, "No hay un arriendo activo para esta publicación"];

    await repositorioArriendo.update({ id: arriendo.id }, { status: "FINISHED", finishedAt: new Date() });
    await repositorioPublicacion.update({ id: publicacion.id }, { estado: "activa" });

    const actualizado = await repositorioArriendo.findOne({ where: { id: arriendo.id } });

    try {
      await createNotificacionService({
        userId: arriendo.estudianteId,
        tipo: "RENTAL_FINISHED",
        mensaje: "El arrendador marcó tu arriendo como finalizado",
        targetType: "rental",
        targetId: arriendo.id,
      });
    } catch (notifError) {
      console.error("Error creando notificación de arriendo finalizado:", notifError);
    }

    return [actualizado, null];
  } catch (error) {
    console.error("Error finalizarArriendoPorPublicacionServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function listarArriendosServicio(userId) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);

    const repositorioResena = AppDataSource.getRepository(Review);
    
    const arriendos = await repositorioArriendo.find({
      where: [
        { arrendadorId: Number(userId) },
        { estudianteId: Number(userId) }
      ],
      relations: {
        arrendador: true,
        estudiante: true,
        publicacion: true,
      },
      order: {
        createdAt: "DESC"
      }
    });

    const rentalIds = arriendos.map((arriendo) => arriendo.id);
    const resenas = rentalIds.length > 0
      ? await repositorioResena.find({
          where: {
            rentalId: In(rentalIds),
            authorId: Number(userId),
          },
        })
      : [];

    const resenasPorArriendo = new Map(resenas.map((resena) => [Number(resena.rentalId), resena]));

    const arriendosConResena = arriendos.map((arriendo) => {
      const miResena = resenasPorArriendo.get(Number(arriendo.id)) || null;

      return {
        ...arriendo,
        miResena,
        puedeCalificar: (arriendo.status === "COMPLETED" || arriendo.status === "FINISHED") && !miResena,
      };
    });
    
    return [arriendosConResena, null];
  } catch (error) {
    console.error("Error listarArriendosServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function actualizarArriendoServicio(id, body) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);
    const arriendo = await repositorioArriendo.findOne({ where: { id } });
    if (!arriendo) return [null, "Arriendo no encontrado"];

    await repositorioArriendo.update({ id }, body);
    const actualizado = await repositorioArriendo.findOne({ where: { id } });
    return [actualizado, null];
  } catch (error) {
    console.error("Error actualizarArriendoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function eliminarArriendoServicio(id) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);
    const arriendo = await repositorioArriendo.findOne({ where: { id } });
    if (!arriendo) return [null, "Arriendo no encontrado"];

    await repositorioArriendo.delete({ id });
    return [{ deletedId: id }, null];
  } catch (error) {
    console.error("Error eliminarArriendoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}
