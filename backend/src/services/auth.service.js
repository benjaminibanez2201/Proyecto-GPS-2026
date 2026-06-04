"use strict";
import User from "../entity/user.entity.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { TERMINOS_VERSION } from "../helpers/terminos.helper.js";
import {
  sendRecoveryEmail,
  sendRegistrationReceivedEmail,
} from "./email.service.js";
import {
  commitVerificationUploads,
  removeStoredFiles,
  removeUploadedTempFiles,
} from "../helpers/upload.helper.js";

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
      rut: userFound.rut,
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

function hasRequiredArrendadorFiles(files = {}) {
  return Boolean(
    files.documentoResidencia?.[0]
    && files.documentoVerificacion?.[0]
    && files.documentoVerificacionReverso?.[0]
    && files.fotoPerfil?.[0],
  );
}

function hasRequiredEstudianteFiles(files = {}) {
  return Boolean(
    files.documentoVerificacion?.[0]
    && files.carnetIdentidadFrontal?.[0]
    && files.carnetIdentidadReverso?.[0],
  );
}

export async function registerService(user, uploadedFiles = {}) {
  let uploadsCommitted = false;
  let storedFilePaths = [];

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

    if (rol === "arrendador" && !hasRequiredArrendadorFiles(uploadedFiles)) {
      return [null, createErrorMessage(
        "documentoVerificacion",
        "Debes adjuntar la foto de perfil, el carnet de identidad por ambos lados y el comprobante de residencia.",
      )];
    }

    if (rol === "estudiante" && !hasRequiredEstudianteFiles(uploadedFiles)) {
      return [null, createErrorMessage(
        "documentoVerificacion",
        "Debes adjuntar el certificado de alumno regular y el carnet de identidad por ambos lados.",
      )];
    }

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

    if (
      rol === "arrendador"
      || uploadedFiles.documentoResidencia?.[0]
      || uploadedFiles.documentoVerificacion?.[0]
      || uploadedFiles.documentoVerificacionReverso?.[0]
      || uploadedFiles.carnetIdentidadFrontal?.[0]
      || uploadedFiles.carnetIdentidadReverso?.[0]
      || uploadedFiles.fotoPerfil?.[0]
    ) {
      const { stored, storedPaths } = await commitVerificationUploads(newUser.id, uploadedFiles);
      uploadsCommitted = true;
      storedFilePaths = storedPaths;

      if (stored.documentoResidencia) {
        newUser.documentoResidencia = stored.documentoResidencia;
      }

      if (stored.documentoVerificacion) {
        newUser.documentoVerificacion = stored.documentoVerificacion;
      }

      if (stored.documentoVerificacionReverso) {
        newUser.documentoVerificacionReverso = stored.documentoVerificacionReverso;
      }

      if (stored.carnetIdentidadFrontal) {
        newUser.carnetIdentidadFrontal = stored.carnetIdentidadFrontal;
      }

      if (stored.carnetIdentidadReverso) {
        newUser.carnetIdentidadReverso = stored.carnetIdentidadReverso;
      }

      if (stored.fotoPerfil) {
        newUser.fotoPerfil = stored.fotoPerfil;
      }

      await userRepository.save(newUser);
    }

    try {
      await sendRegistrationReceivedEmail(newUser);
    } catch (emailError) {
      await userRepository.delete({ id: newUser.id });
      await removeStoredFiles(storedFilePaths);
      console.error("Error al enviar correo de registro:", emailError);

      return [null, createErrorMessage(
        "email",
        "No se pudo enviar el correo de registro. Intenta nuevamente.",
      )];
    }

    const { password: _password, ...dataUser } = newUser;

    return [dataUser, null];
  } catch (error) {
    await removeStoredFiles(storedFilePaths);
    console.error("Error al registrar un usuario", error);
    return [null, "Error interno del servidor"];
  } finally {
    if (!uploadsCommitted) {
      await removeUploadedTempFiles(uploadedFiles);
    }
  }
}

export async function forgotPasswordService(email) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: { email },
    });

    const fallbackMessage = "Se enviaron instrucciones de recuperacion si existe una cuenta asociada a ese correo.";

    if (!userFound) {
      return [fallbackMessage, null];
    }

    const resetToken = jwt.sign({ id: userFound.id }, ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

    userFound.resetPasswordToken = resetToken;
    userFound.resetPasswordExpires = new Date(Date.now() + 3600000);

    await userRepository.save(userFound);
    await sendRecoveryEmail(userFound.email, resetToken);

    return ["Instrucciones para restablecer la contrasena han sido enviadas a tu correo electronico", null];
  } catch (error) {
    console.error("Error al solicitar restablecimiento de contrasena:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function resetPasswordService(token, newPassword) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    try {
      jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch {
      return [null, "El enlace de restablecimiento es invalido o ha expirado"];
    }

    const userFound = await userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!userFound) {
      return [null, "El token no existe o ya ha sido utilizado"];
    }

    if (userFound.resetPasswordExpires < new Date()) {
      return [null, "El enlace de restablecimiento ha expirado"];
    }

    userFound.password = await encryptPassword(newPassword);
    userFound.resetPasswordToken = null;
    userFound.resetPasswordExpires = null;

    await userRepository.save(userFound);

    return ["Contrasena restablecida exitosamente", null];
  } catch (error) {
    console.error("Error al restablecer la contrasena:", error);
    return [null, "Error interno del servidor"];
  }
}
