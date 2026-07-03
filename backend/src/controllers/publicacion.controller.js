"use strict";
import { 
  createPublicacionService,
  deletePublicacionService,
  getPublicacionDetalleService,
  getPublicacionesService,
  obtenerPublicacionesArrendadorService,
  updatePublicacionService 
} from "../services/publicacion.service.js";
import { incrementarVisualizacionesPublicacionServicio } from "../services/publicacion.estadisticas.service.js";
import { 
  publicacionBodyValidation,
  publicacionIdValidation,
  publicacionQueryValidation,
  publicacionUpdateValidation
} from "../validations/publicacion.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

function normalizePublicacionBody(body = {}) {
  const normalized = { ...body };

  if (normalized.precioMensual !== undefined && normalized.precioMensual !== "") {
    normalized.precioMensual = Number(normalized.precioMensual);
  }

  if (normalized.distanciaCampus !== undefined && normalized.distanciaCampus !== "") {
    normalized.distanciaCampus = Number(normalized.distanciaCampus);
  }

  if (normalized.latitud !== undefined && normalized.latitud !== "") {
    normalized.latitud = Number(normalized.latitud);
  }

  if (normalized.longitud !== undefined && normalized.longitud !== "") {
    normalized.longitud = Number(normalized.longitud);
  }

  if (normalized.serviciosIncluidos !== undefined) {
    if (typeof normalized.serviciosIncluidos === "string") {
      try {
        const parsed = JSON.parse(normalized.serviciosIncluidos);
        normalized.serviciosIncluidos = Array.isArray(parsed) ? parsed : [normalized.serviciosIncluidos];
      } catch {
        normalized.serviciosIncluidos = normalized.serviciosIncluidos
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
  }

  if (normalized.reglasConvivencia === undefined && normalized.rules !== undefined) {
    normalized.reglasConvivencia = normalized.rules;
  }

  if (normalized.fotos !== undefined && typeof normalized.fotos === "string") {
    try {
      const parsed = JSON.parse(normalized.fotos);
      normalized.fotos = Array.isArray(parsed) ? parsed : [normalized.fotos];
    } catch {
      normalized.fotos = [normalized.fotos];
    }
  }

  return normalized;
}

export async function createPublicacion(req, res) {
  try {
    const { body, files } = req;
    const { id, rol, estadoVerificacion } = req.user;

    if (rol !== "arrendador") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los arrendadores pueden crear publicaciones");
    }

    if (estadoVerificacion !== "aprobado") {
      return handleErrorClient(res, 403, "Acceso denegado", "Tu cuenta debe estar verificada para crear publicaciones");
    }

    if (!files?.fotosPublicacion?.length) {
      return handleErrorClient(res, 400, "Error de validación", "Debes adjuntar al menos una foto de la publicación.");
    }

    const normalizedBody = normalizePublicacionBody(body);
    const { error: bodyError } = publicacionBodyValidation.validate(normalizedBody);

    if (bodyError) {
      return handleErrorClient(res, 400, "Error de validación", bodyError.message);
    }

    const [publicacion, publicacionError] = await createPublicacionService(id, normalizedBody, files);

    if (publicacionError) return handleErrorClient(res, 400, "Error creando publicación", publicacionError);

    handleSuccess(res, 201, "Publicación creada correctamente", publicacion);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getPublicaciones(req, res) {
  try {
    const { query } = req;
    const { rol } = req.user;

    if (rol !== "estudiante") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los estudiantes pueden buscar alojamientos");
    }

    const { error: queryError, value: queryValidada } = publicacionQueryValidation.validate(query);
    if (queryError) {
      return handleErrorClient(res, 400, "Error en los filtros de búsqueda", queryError.message);
    }

    const [publicaciones, error] = await getPublicacionesService(queryValidada);
    if (error) {
      return handleErrorClient(res, 400, "Error al buscar publicaciones", error);
    }

    handleSuccess(res, 200, "Búsqueda realizada con éxito", publicaciones);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getPublicacionesPropias(req, res) {
  try {
    const { id, rol } = req.user;

    if (rol !== "arrendador") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los arrendadores pueden ver sus publicaciones");
    }

    const [publicaciones, error] = await obtenerPublicacionesArrendadorService(id);
    if (error) return handleErrorClient(res, 400, "Error al obtener publicaciones", error);

    handleSuccess(res, 200, "Publicaciones obtenidas correctamente", publicaciones);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getPublicacionById(req, res) {
  try {
    const { id: publicacionId } = req.params;
    const { rol } = req.user;

    const { error: paramError, value: paramsValidados } = publicacionIdValidation.validate(req.params);
    if (paramError) {
      return handleErrorClient(res, 400, "ID inválido", paramError.message);
    }

    const [publicacion, error] = await getPublicacionDetalleService(paramsValidados.id);
    if (error) {
      return handleErrorClient(res, 404, "Publicación no encontrada", error);
    }

    if (publicacion?.arrendador?.id && Number(publicacion.arrendador.id) !== Number(req.user.id)) {
      await incrementarVisualizacionesPublicacionServicio(paramsValidados.id);
    }

    handleSuccess(res, 200, "Detalle de la publicación obtenido", publicacion);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updatePublicacion(req, res) {
  try {
    const { body, params, files } = req;
    const { id: publicacionId } = params;
    const { id: arrendadorId, rol } = req.user;

    if (rol !== "arrendador") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los arrendadores pueden editar publicaciones");
    }

    const normalizedBody = normalizePublicacionBody(body);
    const { error: bodyError } = publicacionUpdateValidation.validate(normalizedBody);
    if (bodyError) return handleErrorClient(res, 400, "Error de validación", bodyError.message);

    console.log("BODY NORMALIZADO");
    console.log(normalizedBody);
      
    console.log("FILES");
    console.log(files);

    const [publicacion, error] = await updatePublicacionService(publicacionId, arrendadorId, normalizedBody, files);
    if (error) return handleErrorClient(res, 400, "Error al editar publicación", error);

    handleSuccess(res, 200, "Publicación actualizada correctamente", publicacion);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deletePublicacion(req, res) {
  try {
    const { id: publicacionId } = req.params;
    const { id: arrendadorId, rol } = req.user;

    if (rol !== "arrendador") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los arrendadores pueden eliminar publicaciones");
    }

    const [deleted, error] = await deletePublicacionService(publicacionId, arrendadorId);
    if (error) return handleErrorClient(res, 400, "Error al eliminar publicación", error);

    handleSuccess(res, 200, "Publicación eliminada correctamente", null);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getFavoritos(req, res) {
  try {
    const { id: usuarioId } = req.user;

    const [favoritos, error] = await getFavoritosUsuarioService(usuarioId);
    if (error) return handleErrorClient(res, 400, "Error al obtener favoritos", error);

    handleSuccess(res, 200, "Favoritos obtenidos correctamente", favoritos);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function addFavorito(req, res) {
  try {
    const { id } = req.params;
    const publicacionId = Number(id);
    const { id: usuarioId } = req.user;

    if (!Number.isInteger(publicacionId)) {
      return handleErrorClient(res, 400, "ID de publicación inválido");
    }

    const [favorito, error] = await addFavoritoService(publicacionId, usuarioId);
    if (error) return handleErrorClient(res, 400, "Error al guardar favorito", error);

    handleSuccess(res, 201, "Publicación agregada a favoritos", favorito);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function removeFavorito(req, res) {
  try {
    const { id } = req.params;
    const publicacionId = Number(id);
    const { id: usuarioId } = req.user;

    if (!Number.isInteger(publicacionId)) {
      return handleErrorClient(res, 400, "ID de publicación inválido");
    }

    const [eliminado, error] = await removeFavoritoService(publicacionId, usuarioId);
    if (error) return handleErrorClient(res, 400, "Error al eliminar favorito", error);

    handleSuccess(res, 200, "Publicación eliminada de favoritos", eliminado);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

