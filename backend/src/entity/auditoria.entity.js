"use strict";
import { EntitySchema } from "typeorm";

const AuditoriaAdminSchema = new EntitySchema({
  name: "AuditoriaAdmin",
  tableName: "auditoria_admin",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    accion: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    usuarioAfectadoId: {
      type: "int",
      nullable: false,
    },
    usuarioAfectadoEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    fechaAccion: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relations: {
    adminResponsable: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "admin_id" },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
});

export default AuditoriaAdminSchema;