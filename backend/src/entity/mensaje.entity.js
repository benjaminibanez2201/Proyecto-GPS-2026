"use strict";
import { EntitySchema } from "typeorm";

const MensajeSchema = new EntitySchema({
  name: "Mensaje",
  tableName: "mensajes",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    contenido: {
      type: "text",
      nullable: false,
    },
    leido: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
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
    remitente: {
      type: "many-to-one",
      target: "User",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
  },
});

export default MensajeSchema;
