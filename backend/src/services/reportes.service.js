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
      where: { id_publicacion }, 
      relations: ["owner"] });
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
        relations: ["publicacion", "reporter", "publicacion.owner"] });

    // Agrupar por publicación
    const map = new Map();
    for (const r of pendientes) {
      const pubId = r.publicacion.id_publicacion;
      if (!map.has(pubId)) map.set(pubId, { publicacion: r.publicacion, reportes: [] });
      map.get(pubId).reportes.push(r);
    }

    const result = Array.from(map.values()).map((item) => ({
      publicacion: item.publicacion,
      cantidadReportes: item.reportes.length,
      motivos: item.reportes.map((x) => x.motivo),
      fechas: item.reportes.map((x) => x.createdAt),
      estadoActual: "pendiente",
    }));

    return [result, null];
  } catch (error) {
    console.error("Error listarPublicacionesReportadas:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerDetalleReporte(reportId) {
  try {
    const repoReport = AppDataSource.getRepository(ReportePublicacion);

    const reporte = await repoReport.findOne({ 
        where: { id: reportId }, 
        relations: ["publicacion", "reporter", "publicacion.owner"] });
    if (!reporte) return [null, "Reporte no encontrado"];

    const repoReportes = AppDataSource.getRepository(ReportePublicacion);
    const asociados = await repoReportes.find({ 
        where: { publicacion: { id_publicacion: reporte.publicacion.id_publicacion } }, 
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
      where: { id_publicacion }, 
      relations: ["owner"] });
    if (!publicacion) return [null, "Publicación no encontrada"];

    if (!["mantener", "desactivar"].includes(accion)) return [null, "Acción inválida"];

    if (accion === "desactivar") {
      publicacion.activo = false;
      await repoPublicacion.save(publicacion);
    }

    const pendientes = await repoReport.find({ 
      where: { publicacion: { id_publicacion }, 
      estado: "pendiente" } });
    for (const r of pendientes) {
      r.estado = "revisado";
      r.accion = accion === "mantener" ? "mantenida" : "desactivada";
      r.resolvedAt = new Date();
      await repoReport.save(r);
    }

    const reporteRelacionado = pendientes.length ? pendientes[0] : null;
    const accionRegistro = repoAction.create({ 
        administrador: admin, publicacion, 
        reporte: reporteRelacionado, accion, observacion });
    await repoAction.save(accionRegistro);

    const arrendador = publicacion.owner;
    if (arrendador && arrendador.id) {
      const tipo = accion === "desactivar" ? "publicacion_desactivada" : "reporte_descartado";
      const mensaje = accion === "desactivar"
        ? `Tu publicación ha sido desactivada tras revisión: ${observacion || "Sin observaciones"}`
        : `Tu publicación se mantiene activa tras revisión de reportes.`;

      await createNotificacionService({ 
        userId: arrendador.id, tipo, mensaje, 
        targetType: "Publicacion", 
        targetId: publicacion.id_publicacion });
    }

    return [true, null];
  } catch (error) {
    console.error("Error resolverReporte:", error);
    return [null, "Error interno del servidor"];
  }
}

export default { crearReporte, listarPublicacionesReportadas, obtenerDetalleReporte, resolverReporte };
