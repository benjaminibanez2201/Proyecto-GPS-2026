"use strict";
import {
  crearReporte,
  listarPublicacionesReportadas,
  listarReportesDeUsuario,
  obtenerDetalleReporte,
  resolverReporte,
} from "../services/reportes.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { encodePublicId } from "../helpers/publicId.helper.js";

export async function crearReportePublicacion(req, res) {
  try {
    const reporterId = req.user.id;
    const { id_publicacion, motivo } = req.body;
    if (!id_publicacion || !motivo) return handleErrorClient(res, 400, "Faltan parámetros");

    const [result, error] = await crearReporte(id_publicacion, reporterId, motivo);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 201, "Reporte creado correctamente", result);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function listarReportes(req, res) {
  try {
    const [result, error] = await listarPublicacionesReportadas();
    if (error) return handleErrorServer(res, 500, error);
    return handleSuccess(res, 200, "Reportes obtenidos correctamente", result);
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
      publicacion: reporte.publicacion
        ? { ...reporte.publicacion, publicId: encodePublicId(reporte.publicacion.id) }
        : reporte.publicacion,
    }));

    return handleSuccess(res, 200, "Mis reportes obtenidos correctamente", resultConPublicId);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function detalleReporte(req, res) {
  try {
    const { id } = req.params;
    const [result, error] = await obtenerDetalleReporte(Number(id));
    if (error) return handleErrorClient(res, 404, error);
    return handleSuccess(res, 200, "Detalle del reporte obtenido correctamente", result);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function reviewReporte(req, res) {
  try {
    const adminId = req.user.id;
    const { id_publicacion } = req.params;
    const { accion, observacion } = req.body;
    if (!accion) return handleErrorClient(res, 400, "Falta la acción a realizar");

    const [result, error] = await resolverReporte(Number(id_publicacion), adminId, accion, observacion);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, { ok: true });
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export default { crearReportePublicacion, listarReportes, misReportes, detalleReporte, reviewReporte };
