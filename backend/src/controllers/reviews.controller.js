"use strict";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";
import { crearResenaServicio, obtenerResenasPorUsuarioServicio } from "../services/reviews.service.js";
import { obtenerResenaPorIdServicio, actualizarResenaServicio, eliminarResenaServicio } from "../services/reviews.service.js";

export async function crearResena(req, res) {
  try {
    const authorId = req.user.id;
    const body = req.body;
    const [data, error] = await crearResenaServicio(body, authorId);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 201, "Calificación creada", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function obtenerResenasPorUsuario(req, res) {
  try {
    const { id } = req.params;
    const [data, error] = await obtenerResenasPorUsuarioServicio(Number(id));
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Reviews del usuario", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function obtenerResena(req, res) {
  try {
    const { id } = req.params;
    const [data, error] = await obtenerResenaPorIdServicio(Number(id));
    if (error) return handleErrorClient(res, 404, error);
    return handleSuccess(res, 200, "Reseña obtenida", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function actualizarResena(req, res) {
  try {
    const { id } = req.params;
    const authorId = req.user.id;
    const body = req.body;
    const [data, error] = await actualizarResenaServicio(Number(id), body, authorId);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Reseña actualizada", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function eliminarResena(req, res) {
  try {
    const { id } = req.params;
    const authorId = req.user.id;
    const [data, error] = await eliminarResenaServicio(Number(id), authorId);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Reseña eliminada", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}
