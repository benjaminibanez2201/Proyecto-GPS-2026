"use strict";
import Review from "../entity/review.entity.js";
import User from "../entity/user.entity.js";
import Rental from "../entity/rental.entity.js";
import { AppDataSource } from "../config/configDb.js";

export async function crearResenaServicio(body, authorId) {
  try {
    const repositorioResena = AppDataSource.getRepository(Review);
    const repositorioArriendo = AppDataSource.getRepository(Rental);
    const repositorioUsuario = AppDataSource.getRepository(User);

    const { rentalId, targetUserId, rating, comment } = body;

    const arriendo = await repositorioArriendo.findOne({ where: { id: rentalId } });
    if (!arriendo) return [null, "Arriendo no encontrado"];
    if (arriendo.status !== "COMPLETED") return [null, "El arriendo no está confirmado por ambas partes"];

    const esParticipante = Number(authorId) === Number(arriendo.arrendadorId) || Number(authorId) === Number(arriendo.estudianteId);
    if (!esParticipante) return [null, "No puedes calificar en este arriendo"];

    if (Number(authorId) === Number(targetUserId)) return [null, "No puedes calificarte a ti mismo"];

    const existente = await repositorioResena.findOne({ where: { rentalId: rentalId, authorId: authorId } });
    if (existente) return [null, "Ya existe una calificación de este autor para este arriendo"];

    const nuevaResena = repositorioResena.create({
      rentalId,
      authorId,
      targetUserId,
      rating,
      comment,
    });

    const guardada = await repositorioResena.save(nuevaResena);

    const usuarioTarget = await repositorioUsuario.findOne({ where: { id: targetUserId } });
    if (usuarioTarget) {
      const prevAvg = Number(usuarioTarget.avgRating || 0);
      const prevCount = Number(usuarioTarget.reviewsCount || 0);
      const newCount = prevCount + 1;
      const newAvg = (prevAvg * prevCount + Number(rating)) / newCount;

      await repositorioUsuario.update({ id: targetUserId }, { avgRating: newAvg, reviewsCount: newCount });
    }

    return [guardada, null];
  } catch (error) {
    console.error("Error crearResenaServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerResenasPorUsuarioServicio(userId) {
  try {
    const repositorioResena = AppDataSource.getRepository(Review);

    const resenas = await repositorioResena.find({ where: { targetUserId: userId } });

    return [resenas, null];
  } catch (error) {
    console.error("Error obtenerResenasPorUsuarioServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerResenaPorIdServicio(id) {
  try {
    const repositorioResena = AppDataSource.getRepository(Review);
    const resena = await repositorioResena.findOne({ where: { id } });
    if (!resena) return [null, "Reseña no encontrada"];
    return [resena, null];
  } catch (error) {
    console.error("Error obtenerResenaPorIdServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

async function recomputeUserRating(targetUserId) {
  const repositorioResena = AppDataSource.getRepository(Review);
  const repositorioUsuario = AppDataSource.getRepository(User);

  const all = await repositorioResena.find({ where: { targetUserId } });
  const count = all.length;
  const avg = count === 0 ? 0 : all.reduce((s, r) => s + Number(r.rating), 0) / count;

  await repositorioUsuario.update({ id: targetUserId }, { avgRating: avg, reviewsCount: count });
}

export async function actualizarResenaServicio(id, body, authorId) {
  try {
    const repositorioResena = AppDataSource.getRepository(Review);

    const resena = await repositorioResena.findOne({ where: { id } });
    if (!resena) return [null, "Reseña no encontrada"];
    if (Number(resena.authorId) !== Number(authorId)) return [null, "No tienes permiso para editar esta reseña"];

    const { rating, comment } = body;
    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    await repositorioResena.update({ id }, updateData);
    const actualizado = await repositorioResena.findOne({ where: { id } });

    // recompute target user's rating
    await recomputeUserRating(actualizado.targetUserId);

    return [actualizado, null];
  } catch (error) {
    console.error("Error actualizarResenaServicio:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function eliminarResenaServicio(id, authorId) {
  try {
    const repositorioResena = AppDataSource.getRepository(Review);

    const resena = await repositorioResena.findOne({ where: { id } });
    if (!resena) return [null, "Reseña no encontrada"];
    if (Number(resena.authorId) !== Number(authorId)) return [null, "No tienes permiso para eliminar esta reseña"];

    const targetUserId = resena.targetUserId;
    await repositorioResena.delete({ id });

    await recomputeUserRating(targetUserId);

    return [{ deletedId: id }, null];
  } catch (error) {
    console.error("Error eliminarResenaServicio:", error);
    return [null, "Error interno del servidor"];
  }
}
