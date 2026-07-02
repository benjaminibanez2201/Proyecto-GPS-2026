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
    comuna: {
      type: "enum",
      enum: [
        "concepcion",
        "san_pedro_de_la_paz",
        "talcahuano",
        "chiguayante",
        "hualpen",
        "penco",
      ],
      nullable: true,
    },
    latitud: {
      type: "numeric",
      precision: 10,
      scale: 8,
      nullable: true,
    },
    longitud: {
      type: "numeric",
      precision: 10,
      scale: 8,
      nullable: true,
    },
    fotos: {
      type: "simple-array",
      nullable: true,
    },
    serviciosIncluidos: {
      type: "enum",
      enum: [
        "agua", 
        "luz", 
        "gas", 
        "internet", 
        "tv_cable", 
        "calefaccion", 
        "estacionamiento", 
        "lavadora"
      ],
      array: true,
      default: [],
      nullable: true,
    },
    distanciaCampus: {
      type: "int",
      nullable: true,
    },
    reglasConvivencia: {
      type: "text",
      nullable: true,
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
    estado: {
      type: "enum",
      enum: ["activa", "arrendada", "disponible"],
      default: "activa",
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
    arrendador_id: {
      type: "int",
      nullable: false,
    },
  },
  relations: {
    arrendador: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "arrendador_id" },
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});

export default PublicacionSchema;
