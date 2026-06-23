"use strict";
import { EntitySchema } from "typeorm";

const FavoritoPublicacionSchema = new EntitySchema({
  name: "FavoritoPublicacion",
  tableName: "favoritos_publicaciones",
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
    publicacion: {
      type: "many-to-one",
      target: "Publicacion",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
    usuario: {
      type: "many-to-one",
      target: "User",
      joinColumn: true,
      nullable: false,
      cascade: false,
    },
  },
  indices: [
    {
      name: "UQ_FAVORITO_PUBLICACION_USUARIO",
      columns: ["publicacion", "usuario"],
      unique: true,
    },
  ],
});

export default FavoritoPublicacionSchema;