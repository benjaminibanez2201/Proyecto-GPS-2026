"use strict";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { obtenerEstadisticasPublicacionServicio } from "../services/publicacion.estadisticas.service.js";

export async function obtenerEstadisticasPublicacion(req, res) {
  try {
    const { id_publicacion } = req.params;
    const idPublicacion = Number(id_publicacion);

    if (Number.isNaN(idPublicacion)) {
      return handleErrorClient(res, 400, "El identificador de la publicación no es válido");
    }

    const [data, error] = await obtenerEstadisticasPublicacionServicio(idPublicacion, req.user);

    if (error === "Publicación no encontrada") {
      return handleErrorClient(res, 404, error);
    }

    if (
      error === "No autorizado para consultar las estadísticas de esta publicación"
      || error === "Solo un arrendador puede consultar estas estadísticas"
    ) {
      return handleErrorClient(res, 403, error);
    }

    if (error) {
      return handleErrorServer(res, 500, error);
    }

    return handleSuccess(res, 200, "Estadísticas de publicación obtenidas", data);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export default { obtenerEstadisticasPublicacion };