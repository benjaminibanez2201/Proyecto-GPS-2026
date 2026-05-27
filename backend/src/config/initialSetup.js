"use strict";
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
      },
      {
        nombreCompleto: "Benjamín Ibáñez",
        rut: "12.345.678-9",
        email: "benjaminibanes2003@gmail.com",
        password: "Benja2003.",
        rol: "admin",
        estadoVerificacion: "aprobado",
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

export { createUsers };