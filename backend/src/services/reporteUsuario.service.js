"use strict";
import ReporteUsuario from "../entity/reporte_usuario.entity.js";
import Conversacion from "../entity/conversacion.entity.js";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { createNotificacionService } from "./notificacion.service.js";
import { toggleUserStatusService } from "./user.service.js";

export async function crearReporteUsuario(conversacionId, reporterId, motivo) {
  try {
    const repoConversacion = AppDataSource.getRepository(Conversacion);
    const repoUser = AppDataSource.getRepository(User);
    const repoReporte = AppDataSource.getRepository(ReporteUsuario);

    const conversacion = await repoConversacion.findOne({
      where: { id: conversacionId },
      relations: ["estudiante", "arrendador"],
    });
    if (!conversacion) return [null, "Conversación no encontrada"];

    const esEstudiante = Number(conversacion.estudiante?.id) === Number(reporterId);
    const esArrendador = Number(conversacion.arrendador?.id) === Number(reporterId);
    if (!esEstudiante && !esArrendador) {
      return [null, "No tienes permiso para reportar en esta conversación"];
    }

    const reportado = esEstudiante ? conversacion.arrendador : conversacion.estudiante;
    if (!reportado) return [null, "No se pudo determinar el usuario reportado"];

    const reporter = await repoUser.findOneBy({ id: reporterId });
    if (!reporter) return [null, "Usuario reportante no encontrado"];

    const data = {
      conversacion,
      reportado,
      reporter,
      motivo: String(motivo).trim().slice(0, 200),
    };
    const reporte = repoReporte.create(data);
    const result = await repoReporte.save(reporte);
    return [result, null];
  } catch (error) {
    console.error("Error crearReporteUsuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function listarUsuariosReportados() {
  try {
    const repoReporte = AppDataSource.getRepository(ReporteUsuario);

    const todos = await repoReporte.find({
      relations: ["reportado", "reporter", "conversacion"],
      order: { createdAt: "DESC" },
    });

    const map = new Map();
    for (const r of todos) {
      const estaSuspendido = r.reportado?.estadoCuenta === "suspendido";
      if (r.estado !== "pendiente" && !estaSuspendido) continue;

      const reportadoId = r.reportado.id;
      if (!map.has(reportadoId)) map.set(reportadoId, { reportado: r.reportado, reportes: [] });
      map.get(reportadoId).reportes.push(r);
    }

    const result = Array.from(map.values()).map((item) => ({
      reportado: item.reportado,
      cantidadReportes: item.reportes.length,
      reportes: item.reportes.map((x) => ({
        id: x.id,
        motivo: x.motivo,
        estado: x.estado,
        accion: x.accion,
        createdAt: x.createdAt,
        conversacionId: x.conversacion?.uuid ?? null,
        reporter: x.reporter ? {
          id: x.reporter.id,
          nombreCompleto: x.reporter.nombreCompleto,
          email: x.reporter.email,
        } : null,
      })),
    }));

    return [result, null];
  } catch (error) {
    console.error("Error listarUsuariosReportados:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function listarReportesUsuarioDeReportante(reporterId) {
  try {
    const repoReporte = AppDataSource.getRepository(ReporteUsuario);

    const reportes = await repoReporte.find({
      where: { reporter: { id: reporterId } },
      relations: ["reportado", "conversacion"],
      order: { createdAt: "DESC" },
    });

    const result = reportes.map((reporte) => ({
      id: reporte.id,
      motivo: reporte.motivo,
      estado: reporte.estado,
      accion: reporte.accion,
      createdAt: reporte.createdAt,
      resolvedAt: reporte.resolvedAt,
      reportado: reporte.reportado,
      conversacionId: reporte.conversacion?.uuid ?? null,
    }));

    return [result, null];
  } catch (error) {
    console.error("Error listarReportesUsuarioDeReportante:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function obtenerDetalleReporteUsuario(reportId) {
  try {
    const repoReporte = AppDataSource.getRepository(ReporteUsuario);

    const reporte = await repoReporte.findOne({
      where: { id: reportId },
      relations: ["reportado", "reporter", "conversacion"],
    });
    if (!reporte) return [null, "Reporte no encontrado"];

    const asociados = await repoReporte.find({
      where: { reportado: { id: reporte.reportado.id } },
      relations: ["reporter"],
    });

    return [{ reporte, asociados }, null];
  } catch (error) {
    console.error("Error obtenerDetalleReporteUsuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function resolverReporteUsuario(idUsuarioReportado, administradorId, accion, observacion = null) {
  try {
    const repoReporte = AppDataSource.getRepository(ReporteUsuario);
    const repoUser = AppDataSource.getRepository(User);

    const admin = await repoUser.findOneBy({ id: administradorId });
    if (!admin) return [null, "Administrador no encontrado"];

    const reportado = await repoUser.findOneBy({ id: idUsuarioReportado });
    if (!reportado) return [null, "Usuario reportado no encontrado"];

    if (!["mantener", "suspender", "reactivar"].includes(accion)) return [null, "Acción inválida"];

    if (accion === "suspender") {
      const [, errorToggle] = await toggleUserStatusService(administradorId, idUsuarioReportado, "suspendido");
      if (errorToggle) return [null, errorToggle];
    }

    if (accion === "reactivar") {
      const [, errorToggle] = await toggleUserStatusService(administradorId, idUsuarioReportado, "activo");
      if (errorToggle) return [null, errorToggle];
    }

    const pendientes = await repoReporte.find({
      where: { reportado: { id: idUsuarioReportado }, estado: "pendiente" },
    });

    for (const r of pendientes) {
      r.estado = "revisado";
      r.accion = accion === "mantener"
        ? "mantenida"
        : accion === "suspender"
          ? "suspendida"
          : "reactivada";
      r.resolvedAt = new Date();
      await repoReporte.save(r);
    }

    const tipo = accion === "suspender"
      ? "cuenta_suspendida"
      : accion === "reactivar"
        ? "cuenta_reactivada"
        : "reporte_usuario_descartado";
    const mensaje = accion === "suspender"
      ? `Tu cuenta ha sido suspendida tras revisión: ${observacion || "Sin observaciones"}`
      : accion === "reactivar"
        ? `Tu cuenta ha sido reactivada por el administrador${observacion ? `: ${observacion}` : "."}`
        : "Tu cuenta se mantiene activa tras revisión de reportes.";

    await createNotificacionService({
      userId: reportado.id,
      tipo,
      mensaje,
      targetType: "Usuario",
      targetId: reportado.id,
    });

    return [true, null];
  } catch (error) {
    console.error("Error resolverReporteUsuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export default {
  crearReporteUsuario,
  listarUsuariosReportados,
  listarReportesUsuarioDeReportante,
  obtenerDetalleReporteUsuario,
  resolverReporteUsuario,
};
