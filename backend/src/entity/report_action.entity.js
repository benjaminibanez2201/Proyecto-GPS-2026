"use strict";
import { EntitySchema } from "typeorm";

const ReportActionSchema = new EntitySchema({
  name: "ReportAction",
  tableName: "reportes_acciones",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    accion: {
      type: "enum",
      enum: ["mantener", "desactivar", "reactivar"],
      nullable: false,
    },
    observacion: {
      type: "text",
      nullable: true,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relations: {
    administrador: {
      type: "many-to-one",
      target: "User",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
    publicacion: {
      type: "many-to-one",
      target: "Publicacion",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
    reporte: {
      type: "many-to-one",
      target: "ReportePublicacion",
      joinColumn: {
        name: "id_reporte",
      },
      nullable: true,
      cascade: false,
    },
  },
});

export default ReportActionSchema;
