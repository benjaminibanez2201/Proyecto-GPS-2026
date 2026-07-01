"use strict";
import Publicacion from "../entity/publicacion.entity.js";
import User from "../entity/user.entity.js";
import { AppDataSource } from "./configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";

async function createUsers() {
  try {
    if (!AppDataSource.isInitialized) {
      console.log("DB no inicializada - omitiendo creación de usuarios de inicialización");
      return;
    }

    const userRepository = AppDataSource.getRepository(User);

    // Lista de usuarios que queremos asegurar en la base de datos
    const usersToEnsure = [
      {
        nombreCompleto: "Usuario Administrador",
        rut: "21.308.779-3",
        email: "administrador2024@gmail.cl",
        password: "Admin1234.",
        rol: "admin",
        estadoVerificacion: "aprobado",
        estadoCuenta: "activo",
      },
      {
        nombreCompleto: "Usuario Estudiante",
        rut: "19.123.456-7",
        email: "estudiante1@gmail.cl",
        password: "Estudiante1234.",
        rol: "estudiante",
        estadoVerificacion: "aprobado",
        estadoCuenta: "activo",
      },
      {
        nombreCompleto: "Usuario Arrendador",
        rut: "20.111.222-3",
        email: "arrendador1@gmail.cl",
        password: "Arrendador1234.",
        rol: "arrendador",
        estadoVerificacion: "aprobado",
        estadoCuenta: "activo",
      },
    ];

    const created = [];
    for (const u of usersToEnsure) {
      const exists = await userRepository.findOne({ where: { email: u.email } });
      if (!exists) {
        const newUser = userRepository.create({
          nombreCompleto: u.nombreCompleto,
          rut: u.rut,
          email: u.email,
          password: await encryptPassword(u.password),
          rol: u.rol,
          estadoVerificacion: u.estadoVerificacion,
        });
        await userRepository.save(newUser);
        created.push(u.email);
      }
    }

    if (created.length) {
      console.log(`* => Usuarios creados: ${created.join(", ")}`);
    } else {
      console.log("* => No se crearon usuarios (ya existentes)");
    }
  } catch (error) {
    console.error("Error al crear usuarios:", error);
  }
}

async function createDefaultPublicacion() {
  try {
    if (!AppDataSource.isInitialized) {
      console.log("DB no inicializada - omitiendo creación de publicación de inicialización");
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const publicacionRepository = AppDataSource.getRepository(Publicacion);

    const arrendador = await userRepository.findOne({
      where: { email: "arrendador1@gmail.cl" },
    });

    if (!arrendador) {
      console.log("* => No se creó la publicación default (arrendador no existe)");
      return;
    }

    const tituloDefault = "Departamento de prueba para mensajes";

    const alreadyExists = await publicacionRepository.findOne({
      where: {
        titulo: tituloDefault,
        arrendador: { id: arrendador.id },
      },
      relations: ["arrendador"],
    });

    if (!alreadyExists) {
      const publicacion = publicacionRepository.create({
        titulo: tituloDefault,
        tipoInmueble: "departamento",
        precioMensual: 280000,
        ubicacion: "Prueba 123, Santiago",
        fotos: ["https://example.com/foto-prueba-1.jpg"],
        serviciosIncluidos: ["agua", "luz", "internet"],
        reglasConvivencia: "Publicación semilla para validar el flujo de mensajes.",
        arrendador,
      });

      await publicacionRepository.save(publicacion);
      console.log("* => Publicación default creada: Departamento de prueba para mensajes");
    } else {
      console.log("* => No se creó la publicación default (ya existente)");
    }
  } catch (error) {
    console.error("Error al crear publicación default:", error);
  }
}

export { createUsers, createDefaultPublicacion };
