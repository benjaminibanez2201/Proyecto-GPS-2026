"use strict";
import User from "../entity/user.entity.js";
import { AppDataSource } from "./configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";

async function createUsers() {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const count = await userRepository.count();
    if (count > 0) return;

    await Promise.all([
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Usuario Administrador",
          rut: "21.308.779-3",
          email: "administrador2024@gmail.cl",
          password: await encryptPassword("Admin1234."),
          rol: "admin",
          estadoVerificacion: "aprobado",
        }),
      ),
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Usuario Estudiante",
          rut: "19.123.456-7",
          email: "estudiante1@gmail.cl",
          password: await encryptPassword("Estudiante1234."),
          rol: "estudiante",
          estadoVerificacion: "aprobado",
        }),
      ),
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Usuario Arrendador",
          rut: "20.111.222-3",
          email: "arrendador1@gmail.cl",
          password: await encryptPassword("Arrendador1234."),
          rol: "arrendador",
          estadoVerificacion: "aprobado",
        }),
      ),
    ]);

    console.log("* => Usuarios creados exitosamente");
  } catch (error) {
    console.error("Error al crear usuarios:", error);
  }
}

export { createUsers };