"use strict";
import User from "../entity/user.entity.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { TERMINOS_VERSION } from "../helpers/terminos.helper.js";
import {
  sendEmailVerificationEmail,
  sendRecoveryEmail,
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

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function createEmailVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function applyEmailVerificationToken(user) {
  const token = createEmailVerificationToken();

  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);

  return token;
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

    if (userFound.rol !== "admin" && userFound.emailVerificado === false) {
      return [null, createErrorMessage(
        "emailVerificado",
        "Debes verificar tu correo electronico antes de iniciar sesion. Revisa tu bandeja de entrada.",
      )];
    }

    if (userFound.estadoVerificacion === "pendiente") {
      const pendingMessage = userFound.solicitudAntecedentes
        ? [
          "El administrador solicito antecedentes adicionales para revisar tu cuenta.",
          "Revisa tu correo y envia la informacion solicitada.",
        ].join(" ")
        : "Tu cuenta esta pendiente de verificacion. Por favor, espera a que sea aprobada.";

      return [null, createErrorMessage(
        "estadoVerificacion",
        pendingMessage,
      )];
    } else if (userFound.estadoVerificacion === "rechazado") {
      const rejectedMessage = userFound.motivoRechazo
        ? `Tu cuenta fue rechazada. Motivo: ${userFound.motivoRechazo}`
        : "Tu cuenta ha sido rechazada. Por favor, contacta al soporte para mas informacion.";

      return [null, createErrorMessage(
        "estadoVerificacion",
        rejectedMessage,
      )];
    }

    const payload = {
      id: userFound.id,
      nombreCompleto: userFound.nombreCompleto,
      email: userFound.email,
      emailVerificado: userFound.emailVerificado,
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
    && files.documentoVerificacionReverso?.[0],
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
        "Debes adjuntar el carnet de identidad por ambos lados y el comprobante de residencia.",
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

    const emailVerificationToken = applyEmailVerificationToken(newUser);
    newUser.emailVerificado = false;
    newUser.emailVerificadoEn = null;

    await userRepository.save(newUser);

    const registerVerificationUploads = {
      carnetIdentidadFrontal: uploadedFiles.carnetIdentidadFrontal,
      carnetIdentidadReverso: uploadedFiles.carnetIdentidadReverso,
      documentoResidencia: uploadedFiles.documentoResidencia,
      documentoVerificacion: uploadedFiles.documentoVerificacion,
      documentoVerificacionReverso: uploadedFiles.documentoVerificacionReverso,
    };

    if (
      rol === "arrendador"
      || uploadedFiles.documentoResidencia?.[0]
      || uploadedFiles.documentoVerificacion?.[0]
      || uploadedFiles.documentoVerificacionReverso?.[0]
      || uploadedFiles.carnetIdentidadFrontal?.[0]
      || uploadedFiles.carnetIdentidadReverso?.[0]
    ) {
      const { stored, storedPaths } = await commitVerificationUploads(newUser.id, registerVerificationUploads);
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

      await userRepository.save(newUser);
    }

    try {
      await sendEmailVerificationEmail(newUser, emailVerificationToken);
    } catch (emailError) {
      await userRepository.delete({ id: newUser.id });
      await removeStoredFiles(storedFilePaths);
      console.error("Error al enviar correo de registro:", emailError);

      return [null, createErrorMessage(
        "email",
        "No se pudo enviar el correo de registro. Intenta nuevamente.",
      )];
    }

    const {
      emailVerificationExpires: _emailVerificationExpires,
      emailVerificationToken: _emailVerificationToken,
      password: _password,
      ...dataUser
    } = newUser;

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

export async function verifyEmailService(token) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    if (!token) {
      return [null, "El enlace de verificacion es invalido"];
    }

    const userFound = await userRepository
      .createQueryBuilder("user")
      .addSelect([
        "user.emailVerificationExpires",
        "user.emailVerificationToken",
      ])
      .where("user.emailVerificationToken = :token", { token })
      .getOne();

    if (!userFound) {
      return [null, "El enlace de verificacion es invalido o ya fue utilizado"];
    }

    if (!userFound.emailVerificationExpires || userFound.emailVerificationExpires < new Date()) {
      return [null, "El enlace de verificacion ha expirado. Solicita un nuevo correo de verificacion."];
    }

    userFound.emailVerificado = true;
    userFound.emailVerificadoEn = new Date();
    userFound.emailVerificationToken = null;
    userFound.emailVerificationExpires = null;

    await userRepository.save(userFound);

    return ["Correo electronico verificado correctamente", null];
  } catch (error) {
    console.error("Error al verificar correo electronico:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function resendEmailVerificationService(email) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository
      .createQueryBuilder("user")
      .addSelect([
        "user.emailVerificationExpires",
        "user.emailVerificationToken",
      ])
      .where("user.email = :email", { email })
      .getOne();

    if (!userFound) {
      return ["Si existe una cuenta pendiente, enviaremos un nuevo correo de verificacion.", null];
    }

    if (userFound.emailVerificado) {
      return ["Este correo ya se encuentra verificado.", null];
    }

    const emailVerificationToken = applyEmailVerificationToken(userFound);

    await userRepository.save(userFound);
    await sendEmailVerificationEmail(userFound, emailVerificationToken);

    return ["Enviamos un nuevo correo de verificacion.", null];
  } catch (error) {
    console.error("Error al reenviar correo de verificacion:", error);
    return [null, "No se pudo enviar el correo de verificacion. Intenta nuevamente."];
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
