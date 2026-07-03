"use strict";
import { EntitySchema } from "typeorm";

const ConversacionSchema = new EntitySchema({
  name: "Conversacion",
  tableName: "conversaciones",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    ultimaFechaMensaje: {
      type: "timestamp with time zone",
      nullable: true,
    },
    noLeidosArrendador: {
      type: "int",
      default: 0,
      nullable: false,
    },
    noLeidosEstudiante: {
      type: "int",
      default: 0,
      nullable: false,
    },
    ocultadaPorArrendador: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    ocultadaPorEstudiante: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updatedAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
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
    estudiante: {
      type: "many-to-one",
      target: "User",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
    arrendador: {
      type: "many-to-one",
      target: "User",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
  },
});

export default ConversacionSchema;
