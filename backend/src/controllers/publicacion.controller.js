"use strict";
import { 
  createPublicacionService,
  getPublicacionesService,
  getPublicacionDetalleService,
  obtenerPublicacionesArrendadorService,
  updatePublicacionService,
  deletePublicacionService 
 } from "../services/publicacion.service.js";
import { 
  publicacionBodyValidation,
  publicacionUpdateValidation,
  publicacionQueryValidation,
  publicacionIdValidation
} from "../validations/publicacion.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";


export async function createPublicacion(req, res) {
  try {
    const { body } = req;
    const { id, rol, estadoVerificacion } = req.user;

    if (rol !== "arrendador") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los arrendadores pueden crear publicaciones");
    }

    if (estadoVerificacion !== "aprobado") {
      return handleErrorClient(res, 403, "Acceso denegado", "Tu cuenta debe estar verificada para crear publicaciones");
    }

    const { error: bodyError } = publicacionBodyValidation.validate(body);

    if (bodyError) {
      return handleErrorClient(res, 400, "Error de validación", bodyError.message);
    }

    const [publicacion, publicacionError] = await createPublicacionService(id, body);

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

    handleSuccess(res, 200, "Detalle de la publicación obtenido", publicacion);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updatePublicacion(req, res) {
  try {
    const { body, params } = req;
    const { id: publicacionId } = params;
    const { id: arrendadorId, rol } = req.user;

    if (rol !== "arrendador") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los arrendadores pueden editar publicaciones");
    }

    const { error: bodyError } = publicacionUpdateValidation.validate(body);
    if (bodyError) return handleErrorClient(res, 400, "Error de validación", bodyError.message);

    const [publicacion, error] = await updatePublicacionService(publicacionId, arrendadorId, body);
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
