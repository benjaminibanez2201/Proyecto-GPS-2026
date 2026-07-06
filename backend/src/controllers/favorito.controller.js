"use strict";
import { 
    createFavoritoService,
    deleteFavoritoService,
    getFavoritosService
 } from "../services/favorito.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { isValidPublicId } from "../helpers/publicId.helper.js";

export async function createFavorito(req, res) {
  try {
    const { publicacionId } = req.body;
    const { id: estudianteId, rol } = req.user;

    if (rol !== "estudiante") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los estudiantes pueden guardar favoritos");
    }

    if (!isValidPublicId(publicacionId)) {
      return handleErrorClient(res, 400, "Error de validación", "El publicacionId es obligatorio y debe ser válido");
    }

    const [favorito, error] = await createFavoritoService(estudianteId, publicacionId);

    if (error) {
      return handleErrorClient(res, 400, "Error al guardar en favoritos", error);
    }

    handleSuccess(res, 201, "Publicación guardada en favoritos", favorito);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteFavorito(req, res) {
  try {
    const { publicacionId } = req.params; 
    const { id: estudianteId, rol } = req.user;

    if (rol !== "estudiante") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los estudiantes pueden gestionar favoritos");
    }

    if (!isValidPublicId(publicacionId)) {
      return handleErrorClient(res, 400, "Error de validación", "El ID de la publicación es obligatorio y debe ser válido");
    }

    const [eliminado, error] = await deleteFavoritoService(estudianteId, publicacionId);

    if (error) {
      return handleErrorClient(res, 400, "Error al quitar de favoritos", error);
    }

    handleSuccess(res, 200, "Publicación eliminada de tus favoritos correctamente", null);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getFavoritos(req, res) {
  try {
    const { id: estudianteId, rol } = req.user;

    if (rol !== "estudiante") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los estudiantes tienen lista de favoritos");
    }

    const [favoritos, error] = await getFavoritosService(estudianteId);

    if (error) {
      return handleErrorClient(res, 400, "Error al obtener favoritos", error);
    }

    const favoritosConPublicId = favoritos.map((favorito) => ({
      ...favorito,
      publicacion: favorito.publicacion
        ? { ...favorito.publicacion, publicId: favorito.publicacion.uuid }
        : favorito.publicacion,
    }));

    handleSuccess(res, 200, "Favoritos obtenidos con éxito", favoritosConPublicId);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}