"use strict";
import Notificacion from "../entity/notificacion.entity.js";
import { AppDataSource } from "../config/configDb.js";

export async function createNotificacionService(data) {
    try {
        const notificacionRepository = AppDataSource.getRepository(Notificacion);

        if (data.tipo !== undefined && data.tipo !== null) data.tipo = String(data.tipo).trim().slice(0, 32);
        if (data.mensaje !== undefined && data.mensaje !== null) data.mensaje = String(data.mensaje).trim().slice(0, 255);

        const notificacion = notificacionRepository.create(data);
        const result = await notificacionRepository.save(notificacion);
        return [result, null];
    } catch (error) {
        console.error("Error al crear la notificación:", error);
        return [null, "Error interno del servidor"];
    }
}

export async function getNotificacionesByUserIdService(userId, options = {}) {
    try {
        const notificacionRepository = AppDataSource.getRepository(Notificacion);

        const limit = options.limit ?? 50;
        const offset = options.offset ?? 0;

        const notificaciones = await notificacionRepository.find({
            where: { userId: userId },
            order: { createdAt: "DESC" },
            take: limit,
            skip: offset,
        });

        return [notificaciones, null];
    } catch (error) {
        console.error("Error al obtener las notificaciones:", error);
        return [null, "Error interno del servidor"];
    }
}

export async function marcarNotificacionLeidaService(notificacionId, requestingUserId = null) {
    try {
        const notificacionRepository = AppDataSource.getRepository(Notificacion);

        const notificacion = await notificacionRepository.findOne({
            where: { id: notificacionId },
        });

        if (!notificacion) return [null, "Notificación no encontrada"];

        if (requestingUserId !== null && Number(notificacion.userId) !== Number(requestingUserId)) {
            return [null, "No tienes permiso para modificar esta notificación"];
        }

        notificacion.leida = true;
        notificacion.readAt = new Date();

        const result = await notificacionRepository.save(notificacion);
        return [result, null];
    } catch (error) {
        console.error("Error al marcar la notificación como leída:", error);
        return [null, "Error interno del servidor"];
    }
}

export async function eliminarNotificacionService(notificacionId, requestingUserId = null) {
    try {
        const notificacionRepository = AppDataSource.getRepository(Notificacion);

        const notificacion = await notificacionRepository.findOne({
            where: { id: notificacionId },
        });

        if (!notificacion) return [null, "Notificación no encontrada"];

        if (requestingUserId !== null && Number(notificacion.userId) !== Number(requestingUserId)) {
            return [null, "No tienes permiso para eliminar esta notificación"];
        }

        const result = await notificacionRepository.remove(notificacion);
        return [result, null];
    } catch (error) {
        console.error("Error al eliminar la notificación:", error);
        return [null, "Error interno del servidor"];
    }
}

export async function marcarTodasNotificacionesLeidasService(userId) {
    try {
        const notificacionRepository = AppDataSource.getRepository(Notificacion);

        const result = await notificacionRepository
            .createQueryBuilder()
            .update()
            .set({ leida: true, readAt: () => "CURRENT_TIMESTAMP" })
            .where('"userId" = :userId AND leida = false', { userId })
            .execute();

        return [result, null];
    } catch (error) {
        console.error("Error al marcar todas las notificaciones como leídas:", error);
        return [null, "Error interno del servidor"];
    }
}

// retornar el conteo de notificaciones no leídas para un usuario
export async function getNotificacionesNoLeidasCountService(userId) {
    try {
        const notificacionRepository = AppDataSource.getRepository(Notificacion);

        const count = await notificacionRepository.count({
            where: { userId: userId, leida: false }
        });

        return [count, null];
    } catch (error) {
        console.error("Error al obtener el conteo de notificaciones no leídas:", error);
        return [null, "Error interno del servidor"];
    }
}
    