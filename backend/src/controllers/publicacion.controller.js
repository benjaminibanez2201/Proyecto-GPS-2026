"use strict";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import {
  obtenerDetallePublicacionServicio,
  agregarFavoritoServicio,
  eliminarFavoritoServicio,
} from "../services/publicacion.service.js";

export async function obtenerDetallePublicacion(req, res) {
  try {
    const idPublicacion = Number(req.params.id_publicacion);

    if (Number.isNaN(idPublicacion)) {
      return handleErrorClient(res, 400, "El identificador de la publicación no es válido");
    }

    const [data, error] = await obtenerDetallePublicacionServicio(idPublicacion, req.user);

    if (error === "Publicación no encontrada") {
      return handleErrorClient(res, 404, error);
    }

    if (
      error === "Solo un estudiante puede visualizar este detalle" ||
      error === "Solo un estudiante puede marcar favoritos" ||
      error === "Solo un estudiante puede eliminar favoritos"
    ) {
      return handleErrorClient(res, 403, error);
    }

    if (error) {
      return handleErrorServer(res, 500, error);
    }

    return handleSuccess(res, 200, "Detalle de publicación obtenido", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function agregarFavorito(req, res) {
  try {
    const idPublicacion = Number(req.params.id_publicacion);

    if (Number.isNaN(idPublicacion)) {
      return handleErrorClient(res, 400, "El identificador de la publicación no es válido");
    }

    const [data, error] = await agregarFavoritoServicio(idPublicacion, req.user);

    if (error === "Publicación no encontrada") {
      return handleErrorClient(res, 404, error);
    }

    if (error === "Solo un estudiante puede marcar favoritos") {
      return handleErrorClient(res, 403, error);
    }

    if (error) {
      return handleErrorServer(res, 500, error);
    }

    return handleSuccess(res, 200, "Favorito agregado", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function eliminarFavorito(req, res) {
  try {
    const idPublicacion = Number(req.params.id_publicacion);

    if (Number.isNaN(idPublicacion)) {
      return handleErrorClient(res, 400, "El identificador de la publicación no es válido");
    }

    const [data, error] = await eliminarFavoritoServicio(idPublicacion, req.user);

    if (error === "Publicación no encontrada") {
      return handleErrorClient(res, 404, error);
    }

    if (error === "Solo un estudiante puede eliminar favoritos") {
      return handleErrorClient(res, 403, error);
    }

    if (error) {
      return handleErrorServer(res, 500, error);
    }

    return handleSuccess(res, 200, "Favorito eliminado", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export default {
  obtenerDetallePublicacion,
  agregarFavorito,
  eliminarFavorito,
};