"use strict";
import { createPublicacionService } from "../services/publicacion.service.js";
import { publicacionBodyValidation } from "../validations/publicacion.validation.js";
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