"use strict";
import { EntitySchema } from "typeorm";

const PublicacionSchema = new EntitySchema({
  name: "Publicacion",
  tableName: "publicaciones",
  columns: {
    id_publicacion: {
      type: "int",
      primary: true,
      generated: true,
    },
    titulo: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    descripcion: {
      type: "text",
      nullable: true,
    },
    activo: {
      type: "boolean",
      default: true,
      nullable: false,
    },
    contadorViews: {
      type: "int",
      default: 0,
      nullable: false,
    },
    contadorFavoritos: {
      type: "int",
      default: 0,
      nullable: false,
    },
    contadorConversaciones: {
      type: "int",
      default: 0,
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
    owner: {
      type: "many-to-one",
      target: "User",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
  },
});

export default PublicacionSchema;
