"use strict";
import { getAuditoriaService } from "../services/auditoria.service.js";
import { auditoriaQueryValidation } from "../validations/auditoria.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function getAuditoria(req, res) {
  try {
    const { query } = req;

    const { error: queryError, value: queryValidada } = auditoriaQueryValidation.validate(query);
    if (queryError) {
      return handleErrorClient(res, 400, "Error en los filtros de auditoría", queryError.message);
    }

    const [resultado, error] = await getAuditoriaService(queryValidada);
    if (error) {
      return handleErrorClient(res, 400, "Error al obtener la auditoría", error);
    }

    handleSuccess(res, 200, "Auditoría obtenida con éxito", resultado);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}