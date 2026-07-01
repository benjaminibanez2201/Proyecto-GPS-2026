"use strict";
import { AppDataSource } from "../config/configDb.js";
import AuditoriaAdminSchema from "../entity/auditoria.entity.js";

export async function getAuditoriaService(filtros = {}) {
  try {
    const auditoriaRepository = AppDataSource.getRepository(AuditoriaAdminSchema);

    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 20;
    const saltar = (pagina - 1) * limite;

    const query = auditoriaRepository
      .createQueryBuilder("auditoria")
      .leftJoin("auditoria.adminResponsable", "admin")
      .select([
        "auditoria.id",
        "auditoria.accion",
        "auditoria.usuarioAfectadoId",
        "auditoria.usuarioAfectadoEmail",
        "auditoria.fechaAccion",
      ])
      .addSelect([
        "admin.id",
        "admin.nombreCompleto",
        "admin.email",
      ]);

    if (filtros.adminNombre) {
      query.andWhere("LOWER(admin.nombreCompleto) LIKE LOWER(:adminNombre)", {
        adminNombre: `%${filtros.adminNombre}%`,
      });
    }

    if (filtros.accion) {
      query.andWhere("auditoria.accion = :accion", { accion: filtros.accion });
    }

    if (filtros.fechaDesde) {
      query.andWhere("auditoria.fechaAccion >= :fechaDesde", { fechaDesde: filtros.fechaDesde });
    }

    if (filtros.fechaHasta) {
      query.andWhere("auditoria.fechaAccion <= :fechaHasta", { fechaHasta: filtros.fechaHasta });
    }

    query.orderBy("auditoria.fechaAccion", "DESC");

    const [registros, total] = await query
      .skip(saltar)
      .take(limite)
      .getManyAndCount();

    return [
      {
        registros,
        total,
        pagina,
        totalPaginas: Math.ceil(total / limite),
      },
      null,
    ];
  } catch (error) {
    console.error("getAuditoriaService error:", {
      filtros,
      message: error?.message,
      stack: error?.stack,
    });
    return [null, error?.message || "Error interno del servidor al obtener la auditoría"];
  }
}