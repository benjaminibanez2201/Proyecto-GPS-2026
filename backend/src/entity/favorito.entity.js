"use strict";
import { EntitySchema } from "typeorm";

const FavoritoSchema = new EntitySchema({
  name: "Favorito",
  tableName: "favoritos",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relations: {
    estudiante: {
      type: "many-to-one",
      target: "User", 
      joinColumn: { name: "estudiante_id" },
      nullable: false,
      onDelete: "CASCADE",
    },
    publicacion: {
      type: "many-to-one",
      target: "Publicacion",
      joinColumn: { name: "publicacion_id" },
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});

export default FavoritoSchema;