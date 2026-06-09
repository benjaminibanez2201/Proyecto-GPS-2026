"use strict";
import { EntitySchema } from "typeorm";

const ArriendoEsquema = new EntitySchema({
  name: "Arriendo",
  tableName: "arriendos",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    arrendadorId: {
      type: "int",
      nullable: false,
    },
    estudianteId: {
      type: "int",
      nullable: false,
    },
    status: {
      type: "enum",
      enum: ["PENDING", "CONFIRMED", "COMPLETED"],
      default: "PENDING",
    },
    confirmedByArrendador: {
      type: "boolean",
      default: false,
    },
    confirmedByEstudiante: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    completedAt: {
      type: "timestamp with time zone",
      nullable: true,
    },
  },
  relations: {
    arrendador: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "arrendadorId",
      },
      nullable: false,
    },
    estudiante: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "estudianteId",
      },
      nullable: false,
    },
  },
});

export default ArriendoEsquema;
