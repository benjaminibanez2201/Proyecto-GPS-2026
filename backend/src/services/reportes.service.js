"use strict";
import ReportePublicacion from "../entity/report.entity.js";
import ReportAction from "../entity/report_action.entity.js";
import Publicacion from "../entity/publicacion.entity.js";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { createNotificacionService } from "./notificacion.service.js";

export async function crearReporte(id_publicacion, reporterId, motivo) {
  try {
    const repoReport = AppDataSource.getRepository(ReportePublicacion);
    const repoPublicacion = AppDataSource.getRepository(Publicacion);
    const repoUser = AppDataSource.getRepository(User);

    const publicacion = await repoPublicacion.findOne({ 
      where: { id: id_publicacion }, 
      relations: ["arrendador"] });
    if (!publicacion) return [null, "Publicación no encontrada"];

    const reporter = await repoUser.findOneBy({ id: reporterId });
    if (!reporter) return [null, "Usuario reportante no encontrado"];

    const data = { publicacion, reporter, motivo: String(motivo).trim().slice(0, 200) };
    const reporte = repoReport.create(data);
    const result = await repoReport.save(reporte);
    return [result, null];
  } catch (error) {
    console.error("Error crearReporte:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function listarPublicacionesReportadas() {
  try {
    const repoReport = AppDataSource.getRepository(ReportePublicacion);

    const pendientes = await repoReport.find({ 
      where: { estado: "pendiente" }, 
      relations: ["publicacion", "reporter", "publicacion.arrendador"] });

    // Agrupar por publicación
    const map = new Map();
    for (const r of pendientes) {
      const pubId = r.publicacion.id;
      if (!map.has(pubId)) map.set(pubId, { publicacion: r.publicacion, reportes: [] });
      map.get(pubId).reportes.push(r);
    }

    const result = Array.from(map.values()).map((item) => ({
      publicacion: item.publicacion,
      cantidadReportes: item.reportes.length,
      reportes: item.reportes.map((x) => ({
        id: x.id,
        motivo: x.motivo,
        estado: x.estado,
        accion: x.accion,
        createdAt: x.createdAt,
        reporter: x.reporter ? {
          id: x.reporter.id,
          nombreCompleto: x.reporter.nombreCompleto,
          email: x.reporter.email,
        } : null,
      })),
      estadoActual: "pendiente",
    }));

    return [result, null];
  } catch (error) {
    console.error("Error listarPublicacionesReportadas:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function listarReportesDeUsuario(reporterId) {
  try {
    const repoReport = AppDataSource.getRepository(ReportePublicacion);

    const reportes = await repoReport.find({
      where: { reporter: { id: reporterId } },
      relations: ["publicacion", "publicacion.arrendador"],
      order: { createdAt: "DESC" },
    });

    const result = reportes.map((reporte) => ({
      id: reporte.id,
      motivo: reporte.motivo,
      estado: reporte.estado,
      accion: reporte.accion,
      createdAt: reporte.createdAt,
      resolvedAt: reporte.resolvedAt,
      publicacion: reporte.publicacion,
    }));

    return [result, null];
  } catch (error) {
    console.error("Error listarReportesDeUsuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerDetalleReporte(reportId) {
  try {
    const repoReport = AppDataSource.getRepository(ReportePublicacion);

    const reporte = await repoReport.findOne({ 
      where: { id: reportId }, 
      relations: ["publicacion", "reporter", "publicacion.arrendador"] });
    if (!reporte) return [null, "Reporte no encontrado"];

    const repoReportes = AppDataSource.getRepository(ReportePublicacion);
    const asociados = await repoReportes.find({ 
      where: { publicacion: { id: reporte.publicacion.id } }, 
      relations: ["reporter"] });

    return [{ reporte, asociados }, null];
  } catch (error) {
    console.error("Error obtenerDetalleReporte:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function resolverReporte(id_publicacion, administradorId, accion, observacion = null) {
  try {
    const repoReport = AppDataSource.getRepository(ReportePublicacion);
    const repoPublicacion = AppDataSource.getRepository(Publicacion);
    const repoAction = AppDataSource.getRepository(ReportAction);
    const repoUser = AppDataSource.getRepository(User);

    const admin = await repoUser.findOneBy({ id: administradorId });
    if (!admin) return [null, "Administrador no encontrado"];

    const publicacion = await repoPublicacion.findOne({ 
      where: { id: id_publicacion }, 
      relations: ["arrendador"] });
    if (!publicacion) return [null, "Publicación no encontrada"];

    if (!["mantener", "desactivar", "reactivar"].includes(accion)) return [null, "Acción inválida"];

    if (accion === "desactivar") {
      publicacion.estado = "inactiva";
      await repoPublicacion.save(publicacion);
    }

    if (accion === "reactivar") {
      publicacion.estado = "activa";
      await repoPublicacion.save(publicacion);
    }

    const pendientes = await repoReport.find({ 
      where: { publicacion: { id: id_publicacion }, 
      estado: "pendiente" } });
    for (const r of pendientes) {
      r.estado = "revisado";
      r.accion = accion === "mantener"
        ? "mantenida"
        : accion === "desactivar"
          ? "desactivada"
          : "reactivada";
      r.resolvedAt = new Date();
      await repoReport.save(r);
    }

    const reporteRelacionado = pendientes.length ? pendientes[0] : null;
    const accionRegistro = repoAction.create({ 
        administrador: admin, publicacion, 
        reporte: reporteRelacionado, accion, observacion });
    await repoAction.save(accionRegistro);

    const arrendador = publicacion.arrendador;
    if (arrendador && arrendador.id) {
      const tipo = accion === "desactivar"
        ? "publicacion_desactivada"
        : accion === "reactivar"
          ? "publicacion_reactivada"
          : "reporte_descartado";
      const mensaje = accion === "desactivar"
        ? `Tu publicación ha sido desactivada tras revisión: ${observacion || "Sin observaciones"}`
        : accion === "reactivar"
          ? `Tu publicación ha sido reactivada por el administrador${observacion ? `: ${observacion}` : "."}`
          : "Tu publicación se mantiene activa tras revisión de reportes.";

      await createNotificacionService({ 
        userId: arrendador.id, tipo, mensaje, 
        targetType: "Publicacion", 
        targetId: publicacion.id });
    }

    return [true, null];
  } catch (error) {
    console.error("Error resolverReporte:", error);
    return [null, "Error interno del servidor"];
  }
}

export default {
  crearReporte,
  listarPublicacionesReportadas,
  listarReportesDeUsuario,
  obtenerDetalleReporte,
  resolverReporte,
};
