"use strict";
import { EntitySchema } from "typeorm";

const ReporteUsuarioSchema = new EntitySchema({
  name: "ReporteUsuario",
  tableName: "reportes_usuarios",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    motivo: {
      type: "text",
      nullable: false,
    },
    estado: {
      type: "enum",
      enum: ["pendiente", "revisado"],
      default: "pendiente",
      nullable: false,
    },
    accion: {
      type: "enum",
      enum: ["sin_accion", "mantenida", "suspendida", "reactivada"],
      default: "sin_accion",
      nullable: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    resolvedAt: {
      type: "timestamp with time zone",
      nullable: true,
    },
  },
  relations: {
    conversacion: {
      type: "many-to-one",
      target: "Conversacion",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
    reportado: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "id_reportado" },
      nullable: false,
      cascade: false,
    },
    reporter: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "id_reporter" },
      nullable: false,
      cascade: false,
    },
  },
});

export default ReporteUsuarioSchema;
