"use strict";
import Rental from "../entity/rental.entity.js";
import Review from "../entity/review.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { In } from "typeorm";
import { sendRentalCompleteEmail } from "./email.service.js";
import { createNotificacionService } from "./notificacion.service.js";

export async function crearArriendoServicio(body) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);

    const nuevoArriendo = repositorioArriendo.create({
      arrendadorId: body.arrendadorId,
      estudianteId: body.estudianteId,
      status: "PENDING",
    });

    const guardado = await repositorioArriendo.save(nuevoArriendo);

    return [guardado, null];
  } catch (error) {
    console.error("Error crearArriendoServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerArriendoPorIdServicio(id) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);

    const arriendo = await repositorioArriendo.findOne({
      where: { id },
      relations: {
        arrendador: true,
        estudiante: true,
      },
    });

    if (!arriendo) return [null, "Arriendo no encontrado"];

    return [arriendo, null];
  } catch (error) {
    console.error("Error obtenerArriendoPorIdServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function confirmarArriendoServicio(arriendoId, userId) {
  try {
    const repositorioArriendo = AppDataSource.getRepository(Rental);

    const arriendo = await repositorioArriendo.findOne({
      where: { id: arriendoId },
      relations: { arrendador: true, estudiante: true },
    });
    if (!arriendo) return [null, "Arriendo no encontrado"];

    const esArrendador = arriendo.arrendadorId === Number(userId);
    const esEstudiante = arriendo.estudianteId === Number(userId);

    if (!esArrendador && !esEstudiante) return [null, "No eres parte de este arriendo"];

    // Si el usuario ya confirmó previamente, no hacer nada (evita envíos múltiples)
    if (esArrendador && arriendo.confirmedByArrendador) return [arriendo, null];
    if (esEstudiante && arriendo.confirmedByEstudiante) return [arriendo, null];

    const actualizacion = {};
    if (esArrendador) actualizacion.confirmedByArrendador = true;
    if (esEstudiante) actualizacion.confirmedByEstudiante = true;

    await repositorioArriendo.update({ id: arriendo.id }, actualizacion);

    const actualizado = await repositorioArriendo.findOne({
      where: { id: arriendoId },
      relations: { arrendador: true, estudiante: true },
    });

    if (actualizado.confirmedByArrendador && actualizado.confirmedByEstudiante) {
      await repositorioArriendo.update({ id: arriendo.id }, { status: "COMPLETED", completedAt: new Date() });
      const final = await repositorioArriendo.findOne({
        where: { id: arriendoId },
        relations: { arrendador: true, estudiante: true },
      });

      // Crear notificaciones para arrendador y estudiante
      try {
        if (final?.arrendador?.id) {
          await createNotificacionService({
            userId: final.arrendador.id,
            tipo: "RENTAL_COMPLETED",
            mensaje: "El arriendo ha sido confirmado por ambas partes",
            targetType: "rental",
            targetId: final.id,
          });
        }

        if (final?.estudiante?.id) {
          await createNotificacionService({
            userId: final.estudiante.id,
            tipo: "RENTAL_COMPLETED",
            mensaje: "El arriendo ha sido confirmado por ambas partes",
            targetType: "rental",
            targetId: final.id,
          });
        }
      } catch (notifError) {
        console.error("Error creando notificaciones de arriendo completado:", notifError);
      }

      // Enviar correos a ambas partes (no bloquear en caso de error)
      try {
        await sendRentalCompleteEmail(final);
      } catch (emailError) {
        console.error("Error enviando correo de arriendo completado:", emailError);
      }

      return [final, null];
    }

    return [actualizado, null];
  } catch (error) {
    console.error("Error confirmarArriendoServicio:", error);
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
        puedeCalificar: arriendo.status === "COMPLETED" && !miResena,
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
