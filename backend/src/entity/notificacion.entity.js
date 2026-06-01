"use strict";
import { EntitySchema } from "typeorm";

const notificacionSchema = new EntitySchema({
    name: "Notificacion",
    tableName: "notificaciones",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true,
        },
        userId: {
            type: "int",
            nullable: false,
        },
        tipo: {
            type: "varchar",
            length: 32,
            nullable: false,
        },
        mensaje: {
            type: "varchar",
            length: 255,
            nullable: false,
        },
        leida: {
            type: "boolean",
            default: false,
            nullable: false,
        },
        readAt: {
            type: "timestamp with time zone",
            nullable: true,
        },
        targetType: {
            type: "varchar",
            length: 40,
            nullable: true,
        },
        targetId: {
            type: "int",
            nullable: true,
        },
        createdAt: {
            type: "timestamp with time zone",
            default: () => "CURRENT_TIMESTAMP",
            nullable: false,
        },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: {
                name: "userId",
            },
            nullable: false,
            onDelete: "CASCADE",
        },
    },
    indices: [
        {
            name: "IDX_NOTIF_USER_CREATED",
            columns: ["userId", "createdAt"],
        },
        {
            name: "IDX_NOTIF_USER_LEIDA",
            columns: ["userId", "leida"],
        },
    ],
});

export default notificacionSchema;