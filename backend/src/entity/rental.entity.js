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
    uuid: {
      type: "uuid",
      generated: "uuid",
      unique: true,
      nullable: false,
    },
    arrendadorId: {
      type: "int",
      nullable: false,
    },
    estudianteId: {
      type: "int",
      nullable: false,
    },
    publicacionId: { //se lo agregue para poder obtener el id de la 
      type: "int", //publicacion en el correo de confimacion de arriendo
      nullable: false, 
    },
    status: {
      type: "enum",
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "FINISHED"],
      default: "PENDING",
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
    finishedAt: {
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
    publicacion: {
      type: "many-to-one",
      target: "Publicacion", 
      joinColumn: {
        name: "publicacionId",
      },
      nullable: false,
    },
  },
});

export default ArriendoEsquema;
