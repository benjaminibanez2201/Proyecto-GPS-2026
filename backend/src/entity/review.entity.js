"use strict";
import { EntitySchema } from "typeorm";

const ResenaEsquema = new EntitySchema({
  name: "Resena",
  tableName: "resenas",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    rentalId: {
      type: "int",
      nullable: false,
    },
    authorId: {
      type: "int",
      nullable: false,
    },
    targetUserId: {
      type: "int",
      nullable: false,
    },
    rating: {
      type: "int",
      nullable: false,
    },
    comment: {
      type: "varchar",
      length: 1000,
      nullable: true,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
});

export default ResenaEsquema;
