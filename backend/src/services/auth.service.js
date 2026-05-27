"use strict";
import User from "../entity/user.entity.js";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";
import { sendRecoveryEmail } from "./email.service.js";

export async function loginService(user) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const { email, password } = user;

    const createErrorMessage = (dataInfo, message) => ({
      dataInfo,
      message
    });

    const userFound = await userRepository.findOne({
      where: { email }
    });

    if (!userFound) {
      return [null, createErrorMessage("auth", "Credenciales incorrectas")];
    }

    const isMatch = await comparePassword(password, userFound.password);

    if (!isMatch) {
      return [null, createErrorMessage("auth", "Credenciales incorrectas")];
    }

    if (userFound.estadoVerificacion === "pendiente") {
      return [null, createErrorMessage("estadoVerificacion", "Tu cuenta está pendiente de verificación. Por favor, espera a que sea aprobada.")];
    } else if (userFound.estadoVerificacion === "rechazado") {
      return [null, createErrorMessage("estadoVerificacion", "Tu cuenta ha sido rechazada. Por favor, contacta al soporte para más información.")];
    }

    // quien eres y que permisos tienes
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
    console.error("Error al iniciar sesión:", error);
    return [null, "Error interno del servidor"];
  }
}


export async function registerService(user) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const { nombreCompleto, rut, email } = user;

    const createErrorMessage = (dataInfo, message) => ({
      dataInfo,
      message
    });

    const existingEmailUser = await userRepository.findOne({
      where: {
        email,
      },
    });
    
    if (existingEmailUser) return [null, createErrorMessage("email", "Correo electrónico en uso")];

    const existingRutUser = await userRepository.findOne({
      where: {
        rut,
      },
    });

    if (existingRutUser) return [null, createErrorMessage("rut", "Rut ya asociado a una cuenta")];

    const newUser = userRepository.create({
      nombreCompleto,
      email,
      rut,
      password: await encryptPassword(user.password),
      rol: "usuario",
    });

    await userRepository.save(newUser);

    const { password, ...dataUser } = newUser;

    return [dataUser, null];
  } catch (error) {
    console.error("Error al registrar un usuario", error);
    return [null, "Error interno del servidor"];
  }
}
// funcion para solicitar la recuperacion de contraseña
export async function forgotPasswordService(email) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const normalizedEmail = email?.trim().toLowerCase();

    console.log("=> Solicitud forgot-password para:", normalizedEmail);

    const userFound = await userRepository.findOne({
      where: { email: normalizedEmail }
    });

    if (!userFound) {
      console.log("=> No se encontró usuario para forgot-password");
      return ["Instrucciones enviadas si el correo existe", null];
    }

    // generar el token de restablecimiento de contraseña

    const resetToken = jwt.sign({ id: userFound.id }, ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

    // Guardar en usuario
    userFound.resetPasswordToken = resetToken;
    userFound.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora

    await userRepository.save(userFound);

    // enviar el correo con el token de restablecimiento 
    await sendRecoveryEmail(userFound.email, resetToken);
    console.log("=> Correo de recuperación solicitado para:", userFound.email);

    return ["Instrucciones enviadas si el correo existe", null];
  } catch (error) {
    console.error("Error al solicitar restablecimiento de contraseña:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function resetPasswordService(token, newPassword) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    //Verificamos que el token sea valido
    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch {
      return [null, "El enlace de restablecimiento es inválido o ha expirado"];
    }

    // buscamos el usuario con el token
    const userFound = await userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!userFound) {
      return [null, "El token no existe o ya ha sido utilizado"];
    }

    if (userFound.resetPasswordExpires < new Date()) {
    return [null, "El enlace de restablecimiento ha expirado"];
    }

    // Hashear la nueva contraseña
    const hashedPassword = await encryptPassword(newPassword);

    // Actualizar la contraseña y limpiar el token
    userFound.password = hashedPassword;
    userFound.resetPasswordToken = null;
    userFound.resetPasswordExpires = null;

    await userRepository.save(userFound);

    return ["Contraseña restablecida exitosamente", null];
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    return [null, "Error interno del servidor"];
  }
}