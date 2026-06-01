"use strict";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";
import { crearArriendoServicio, obtenerArriendoPorIdServicio, confirmarArriendoServicio, listarArriendosServicio, actualizarArriendoServicio, eliminarArriendoServicio } from "../services/rentals.service.js";

export async function crearArriendo(req, res) {
  try {
    const [data, error] = await crearArriendoServicio(req.body);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 201, "Arriendo creado", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function obtenerArriendo(req, res) {
  try {
    const { id } = req.params;
    const [data, error] = await obtenerArriendoPorIdServicio(Number(id));
    if (error) return handleErrorClient(res, 404, error);
    return handleSuccess(res, 200, "Arriendo obtenido", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function confirmarArriendo(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [data, error] = await confirmarArriendoServicio(Number(id), userId);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Confirmación registrada", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function listarArriendos(req, res) {
  try {
    const [data, error] = await listarArriendosServicio();
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Lista de arriendos", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function actualizarArriendo(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;
    const [data, error] = await actualizarArriendoServicio(Number(id), body);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Arriendo actualizado", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function eliminarArriendo(req, res) {
  try {
    const { id } = req.params;
    const [data, error] = await eliminarArriendoServicio(Number(id));
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Arriendo eliminado", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}
