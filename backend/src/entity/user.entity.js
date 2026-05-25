"use strict";
import { EntitySchema } from "typeorm";

const UserSchema = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombreCompleto: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    rut: {
      type: "varchar",
      length: 12,
      nullable: false,
      unique: true,
    },
    email: {
      type: "varchar",
      length: 255,
      nullable: false,
      unique: true,
    },
    rol: {
      type: "enum",
      enum: ["admin", "estudiante", "arrendador"],
      default: "estudiante",
      nullable: false,
    },
    password: {
      type: "varchar",
      nullable: false,
      selecct: false,
    },
    estadoVerificacion: {
      type: "enum",
      enum: ["pendiente", "aprobado", "rechazado"],
      default: "pendiente",
      nullable: false,
    },
    fotoPerfil: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    telefono: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    universidad: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    carrera: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    documentoVerificacion: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    resetPasswordToken: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    resetPasswordExpires: {
      type: "timestamp with time zone",
      nullable: true,
    },
    ultimoLogin: {
      type: "timestamp with time zone",
      nullable: true,
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
    avgRating: {
      type: "float",
      nullable: false,
      default: 0,
    },
    reviewsCount: {
      type: "int",
      nullable: false,
      default: 0,
    },
  },
  indices: [
    {
      name: "IDX_USER_RUT",
      columns: ["rut"],
      unique: true,
    },
    {
      name: "IDX_USER_EMAIL",
      columns: ["email"],
      unique: true,
    },
  ],
});

export default UserSchema;