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
      nullable: true,
    },
    authorId: {
      type: "int",
      nullable: true,
    },
    targetUserId: {
      type: "int",
      nullable: true,
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
    isAnonymous: {
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
    rental: {
      type: "many-to-one",
      target: "Arriendo",
      joinColumn: {
        name: "rentalId",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
    author: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "authorId",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
    targetUser: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "targetUserId",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
});

export default ResenaEsquema;
