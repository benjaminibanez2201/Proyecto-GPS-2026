"use strict";
import { createPublicacionService } from "../services/publicacion.service.js";
import { 
  publicacionBodyValidation,
  publicacionUpdateValidation,
} from "../validations/publicacion.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { 
  obtenerPublicacionesArrendadorService,
  updatePublicacionService,
  deletePublicacionService 
} from "../services/publicacion.service.js";


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