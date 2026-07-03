"use strict";
import {
    createNotificacionService,
    eliminarNotificacionService,
    getNotificacionesByUserIdService,
    getNotificacionesNoLeidasCountService,
    marcarNotificacionLeidaService,
    marcarTodasNotificacionesLeidasService,
} from "../services/notificacion.service.js";

import {
    handleErrorClient,
    handleErrorServer,
    handleSuccess,
} from "../handlers/responseHandlers.js";

function parseOptionalInteger(value) {
    if (value === undefined || value === null || value === "") return undefined;

    const parsedValue = Number.parseInt(value, 10);
    return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

export async function createNotificacion(req, res) {
    try {
        const { body } = req;

        const [newNotificacion, errorNewNotificacion] = await createNotificacionService(body);

        if (errorNewNotificacion) return handleErrorClient(res, 400, errorNewNotificacion);

        handleSuccess(res, 201, "Notificación creada", newNotificacion);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function getNotificacionesByUserId(req, res) {
    try {
        const userId = req.user?.id;

        if (!userId) return handleErrorClient(res, 401, "Usuario no autenticado");

        const { limit, offset } = req.query;

        const options = {};
        const parsedLimit = parseOptionalInteger(limit);
        const parsedOffset = parseOptionalInteger(offset);

        if (parsedLimit !== undefined) options.limit = parsedLimit;
        if (parsedOffset !== undefined) options.offset = parsedOffset;

        const [notificaciones, errorNotificaciones] = await getNotificacionesByUserIdService(userId, options);
        if (errorNotificaciones) return handleErrorClient(res, 400, errorNotificaciones);

        handleSuccess(res, 200, "Notificaciones obtenidas", notificaciones);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function marcarNotificacionLeida(req, res) {
    try {
        const notificacionId = req.params.id;
        const requestingUserId = req.user?.id;

        if (!requestingUserId) return handleErrorClient(res, 401, "Usuario no autenticado");

        const [updatedNotificacion, errorUpdatedNotificacion] = await marcarNotificacionLeidaService(
            notificacionId,
            requestingUserId,
        );

        if (errorUpdatedNotificacion) return handleErrorClient(res, 400, errorUpdatedNotificacion);

        handleSuccess(res, 200, "Notificación marcada como leída", updatedNotificacion);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function marcarTodasNotificacionesLeidas(req, res) {
    try {
        const userId = req.user?.id;

        if (!userId) return handleErrorClient(res, 401, "Usuario no autenticado");

        const [result, errorResult] = await marcarTodasNotificacionesLeidasService(userId);

        if (errorResult) return handleErrorClient(res, 400, errorResult);

        handleSuccess(res, 200, "Todas las notificaciones marcadas como leídas", result);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function eliminarNotificacion(req, res) {
    try {
        const notificacionId = req.params.id;
        const requestingUserId = req.user?.id;

        if (!requestingUserId) return handleErrorClient(res, 401, "Usuario no autenticado");

        const [result, errorResult] = await eliminarNotificacionService(notificacionId, requestingUserId);

        if (errorResult) return handleErrorClient(res, 400, errorResult);

        handleSuccess(res, 200, "Notificación eliminada", result);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function getNotificacionesNoLeidasCount(req, res) {
    try {
        const userId = req.user?.id;

        if (!userId) return handleErrorClient(res, 401, "Usuario no autenticado");

        const [count, errorCount] = await getNotificacionesNoLeidasCountService(userId);

        if (errorCount) return handleErrorClient(res, 400, errorCount);

        handleSuccess(res, 200, "Conteo de notificaciones no leídas obtenido", { count });
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}
