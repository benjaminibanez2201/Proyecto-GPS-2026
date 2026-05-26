"use strict";
import User from "../entity/user.entity.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { TERMINOS_VERSION } from "../helpers/terminos.helper.js";

function createErrorMessage(dataInfo, message) {
  return {
    dataInfo,
    message,
  };
}

export async function loginService(user) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const { email, password } = user;

    const userFound = await userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();

    if (!userFound) {
      return [null, createErrorMessage("auth", "Credenciales incorrectas")];
    }

    const isMatch = await comparePassword(password, userFound.password);

    if (!isMatch) {
      return [null, createErrorMessage("auth", "Credenciales incorrectas")];
    }

    if (userFound.estadoVerificacion === "pendiente") {
      return [null, createErrorMessage(
        "estadoVerificacion",
        "Tu cuenta esta pendiente de verificacion. Por favor, espera a que sea aprobada.",
      )];
    } else if (userFound.estadoVerificacion === "rechazado") {
      return [null, createErrorMessage(
        "estadoVerificacion",
        "Tu cuenta ha sido rechazada. Por favor, contacta al soporte para mas informacion.",
      )];
    }

    const payload = {
      id: userFound.id,
      nombreCompleto: userFound.nombreCompleto,
      email: userFound.email,
      rol: userFound.rol,
      estadoVerificacion: userFound.estadoVerificacion,
    };

    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    return [accessToken, null];
  } catch (error) {
    console.error("Error al iniciar sesion:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function registerService(user) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const {
      carrera,
      email,
      nombreCompleto,
      password,
      rol = "estudiante",
      rut,
      telefono,
      terminosAceptados,
      universidad,
    } = user;

    const existingEmailUser = await userRepository.findOne({
      where: {
        email,
      },
    });

    if (existingEmailUser) {
      return [null, createErrorMessage("email", "Correo electronico en uso")];
    }

    const existingRutUser = await userRepository.findOne({
      where: {
        rut,
      },
    });

    if (existingRutUser) {
      return [null, createErrorMessage("rut", "Rut ya asociado a una cuenta")];
    }

    const newUser = userRepository.create({
      carrera,
      email,
      estadoVerificacion: "pendiente",
      nombreCompleto,
      password: await encryptPassword(password),
      rol,
      rut,
      telefono,
      universidad,
      ...(terminosAceptados === true && {
        terminosAceptadosEn: new Date(),
        terminosVersion: TERMINOS_VERSION,
      }),
    });

    await userRepository.save(newUser);

    const { password: _password, ...dataUser } = newUser;

    return [dataUser, null];
  } catch (error) {
    console.error("Error al registrar un usuario", error);
    return [null, "Error interno del servidor"];
  }
}
