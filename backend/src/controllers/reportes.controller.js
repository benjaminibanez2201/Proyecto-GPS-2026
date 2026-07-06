"use strict";
import {
  crearReporte,
  listarPublicacionesInactivas,
  listarPublicacionesReportadas,
  listarReportesDeUsuario,
  obtenerDetalleReporte,
  resolverReporte,
} from "../services/reportes.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { isValidPublicId } from "../helpers/publicId.helper.js";

export async function crearReportePublicacion(req, res) {
  try {
    const reporterId = req.user.id;
    const { id_publicacion, motivo } = req.body;
    if (!id_publicacion || !motivo) return handleErrorClient(res, 400, "Faltan parámetros");

    if (!isValidPublicId(id_publicacion)) {
      return handleErrorClient(res, 400, "ID inválido", "El identificador de la publicación no es válido");
    }

    const [result, error] = await crearReporte(id_publicacion, reporterId, motivo);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 201, "Reporte creado correctamente", result);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

function agregarPublicIdPublicacion(publicacion) {
  if (!publicacion) return publicacion;
  return {
    ...publicacion,
    publicId: publicacion.uuid,
    arrendador: publicacion.arrendador
      ? { ...publicacion.arrendador, publicId: publicacion.arrendador.uuid }
      : publicacion.arrendador,
  };
}

export async function listarReportes(req, res) {
  try {
    const [result, error] = await listarPublicacionesReportadas();
    if (error) return handleErrorServer(res, 500, error);

    const resultConPublicId = result.map((item) => ({
      ...item,
      publicacion: agregarPublicIdPublicacion(item.publicacion),
    }));

    return handleSuccess(res, 200, "Reportes obtenidos correctamente", resultConPublicId);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function misReportes(req, res) {
  try {
    const reporterId = req.user.id;
    const [result, error] = await listarReportesDeUsuario(reporterId);
    if (error) return handleErrorServer(res, 500, error);

    const resultConPublicId = result.map((reporte) => ({
      ...reporte,
      publicacion: agregarPublicIdPublicacion(reporte.publicacion),
    }));

    return handleSuccess(res, 200, "Mis reportes obtenidos correctamente", resultConPublicId);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function listarInactivas(req, res) {
  try {
    const [result, error] = await listarPublicacionesInactivas();
    if (error) return handleErrorServer(res, 500, error);

    const resultConPublicId = result.map((item) => ({
      ...item,
      publicacion: agregarPublicIdPublicacion(item.publicacion),
    }));

    return handleSuccess(res, 200, "Publicaciones inactivas obtenidas correctamente", resultConPublicId);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function detalleReporte(req, res) {
  try {
    const { id } = req.params;
    const [result, error] = await obtenerDetalleReporte(Number(id));
    if (error) return handleErrorClient(res, 404, error);

    const resultConPublicId = {
      ...result,
      reporte: {
        ...result.reporte,
        publicacion: agregarPublicIdPublicacion(result.reporte.publicacion),
      },
    };

    return handleSuccess(res, 200, "Detalle del reporte obtenido correctamente", resultConPublicId);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function reviewReporte(req, res) {
  try {
    const adminId = req.user.id;
    const { id_publicacion: publicacionUuid } = req.params;
    const { accion, observacion } = req.body;
    if (!accion) return handleErrorClient(res, 400, "Falta la acción a realizar");

    if (!isValidPublicId(publicacionUuid)) {
      return handleErrorClient(res, 400, "ID inválido", "El identificador de la publicación no es válido");
    }

    const [result, error] = await resolverReporte(publicacionUuid, adminId, accion, observacion);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, "Reporte resuelto correctamente", { ok: result });
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export default { crearReportePublicacion, listarReportes, listarInactivas, misReportes, detalleReporte, reviewReporte };
