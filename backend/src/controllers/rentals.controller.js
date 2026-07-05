"use strict";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import {
  actualizarArriendoServicio,
  crearArriendoServicio,
  eliminarArriendoServicio,
  finalizarArriendoPorPublicacionServicio,
  listarArriendosServicio,
  obtenerArriendoPorIdServicio,
} from "../services/rentals.service.js";
import { isValidPublicId } from "../helpers/publicId.helper.js";

function agregarPublicIds(arriendo) {
  if (!arriendo) return arriendo;

  const resultado = { ...arriendo, publicId: arriendo.uuid };

  if (arriendo.estudiante) {
    resultado.estudiante = { ...arriendo.estudiante, publicId: arriendo.estudiante.uuid };
  }

  if (arriendo.arrendador) {
    resultado.arrendador = { ...arriendo.arrendador, publicId: arriendo.arrendador.uuid };
  }

  if (arriendo.publicacion) {
    resultado.publicacion = { ...arriendo.publicacion, publicId: arriendo.publicacion.uuid };
  }

  return resultado;
}

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
    const { id: arriendoUuid } = req.params;
    if (!isValidPublicId(arriendoUuid)) {
      return handleErrorClient(res, 400, "ID inválido", "El identificador del arriendo no es válido");
    }

    const [data, error] = await obtenerArriendoPorIdServicio(arriendoUuid);
    if (error) return handleErrorClient(res, 404, error);

    const userId = Number(req.user.id);
    const esParticipante = userId === Number(data.arrendadorId) || userId === Number(data.estudianteId);
    if (!esParticipante) return handleErrorClient(res, 403, "No autorizado para ver este arriendo");

    return handleSuccess(res, 200, "Arriendo obtenido", agregarPublicIds(data));
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function finalizarArriendoPorPublicacion(req, res) {
  try {
    const { publicacionId } = req.params;
    const arrendadorId = req.user.id;
    const [data, error] = await finalizarArriendoPorPublicacionServicio(Number(publicacionId), arrendadorId);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Arriendo finalizado", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function listarArriendos(req, res) {
  try {
    const userId = req.user.id; // Extraemos el ID del usuario logueado
    const [data, error] = await listarArriendosServicio(userId); // Le pasamos el ID
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Lista de arriendos", data.map(agregarPublicIds));
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
