"use strict";
import { EntitySchema } from "typeorm";

const ReportePublicacionSchema = new EntitySchema({
  name: "ReportePublicacion",
  tableName: "reportes_publicaciones",
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
      enum: ["sin_accion", "mantenida", "desactivada"],
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
    publicacion: {
      type: "many-to-one",
      target: "Publicacion",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
    reporter: {
      type: "many-to-one",
      target: "User",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
  },
});

export default ReportePublicacionSchema;
