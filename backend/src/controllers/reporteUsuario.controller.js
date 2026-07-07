"use strict";
import {
  crearReporteUsuario,
  listarReportesUsuarioDeReportante,
  listarUsuariosReportados,
  obtenerDetalleReporteUsuario,
  resolverReporteUsuario,
} from "../services/reporteUsuario.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function crearReporteDeUsuario(req, res) {
  try {
    const reporterId = req.user.id;
    const { conversacionId, motivo } = req.body;
    if (!conversacionId || !motivo) return handleErrorClient(res, 400, "Faltan parámetros");

    const [result, error] = await crearReporteUsuario(Number(conversacionId), reporterId, motivo);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 201, "Reporte creado correctamente", result);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function listarReportesUsuario(req, res) {
  try {
    const [result, error] = await listarUsuariosReportados();
    if (error) return handleErrorServer(res, 500, error);
    return handleSuccess(res, 200, "Usuarios reportados obtenidos correctamente", result);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function misReportesDeUsuario(req, res) {
  try {
    const reporterId = req.user.id;
    const [result, error] = await listarReportesUsuarioDeReportante(reporterId);
    if (error) return handleErrorServer(res, 500, error);
    return handleSuccess(res, 200, "Mis reportes de usuario obtenidos correctamente", result);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function detalleReporteUsuario(req, res) {
  try {
    const { id } = req.params;
    const [result, error] = await obtenerDetalleReporteUsuario(Number(id));
    if (error) return handleErrorClient(res, 404, error);
    return handleSuccess(res, 200, "Detalle del reporte obtenido correctamente", result);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function reviewReporteUsuario(req, res) {
  try {
    const adminId = req.user.id;
    const { id_usuario } = req.params;
    const { accion, observacion } = req.body;
    if (!accion) return handleErrorClient(res, 400, "Falta la acción a realizar");

    const [result, error] = await resolverReporteUsuario(Number(id_usuario), adminId, accion, observacion);
    if (error) return handleErrorClient(res, 400, error);
    return handleSuccess(res, 200, { ok: true });
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export default {
  crearReporteDeUsuario,
  listarReportesUsuario,
  misReportesDeUsuario,
  detalleReporteUsuario,
  reviewReporteUsuario,
};
