"use strict";
import { EntitySchema } from "typeorm";

const PublicacionSchema = new EntitySchema({
  name: "Publicacion",
  tableName: "publicaciones",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    titulo: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
<<<<<<< HEAD
    descripcion: {
      type: "text",
      nullable: true,
    },
=======
    tipoInmueble: {
      type: "enum",
      enum: ["departamento", "casa", "pieza", "estudio"],
      nullable: false,
    },
    precioMensual: {
      type: "int",
      nullable: false,
    },
    ubicacion: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    fotos: {
      type: "simple-array",
      nullable: true,
    },
    serviciosIncluidos: {
      type: "simple-array",
      nullable: true,
    },
    reglasConvivencia: {
      type: "text",
      nullable: true,
    },
    estado: {
      type: "enum",
      enum: ["activa", "inactiva"],
      default: "activa",
      nullable: false,
    },
>>>>>>> aa5875a84c22379dbeb59c1c2a3d1ca6b4f19c84
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
<<<<<<< HEAD
    owner: {
      type: "many-to-one",
      target: "User",
      joinColumn: true,
      nullable: false,
      cascade: false,
=======
    arrendador: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "arrendador_id" },
      nullable: false,
      onDelete: "CASCADE",
>>>>>>> aa5875a84c22379dbeb59c1c2a3d1ca6b4f19c84
    },
  },
});

<<<<<<< HEAD
export default PublicacionSchema;
=======
export default PublicacionSchema;
>>>>>>> aa5875a84c22379dbeb59c1c2a3d1ca6b4f19c84
