"use strict";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { removeVerificationUploadsForUser } from "../helpers/upload.helper.js";
import {
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
  sendVerificationInfoRequestEmail,
} from "./email.service.js";
import { createNotificacionService } from "./notificacion.service.js";
import { sendCredentialChangedEmail } from "./email.service.js";

const VERIFICATION_STATUSES = ["pendiente", "aprobado", "rechazado"];
const VERIFIABLE_ROLES = ["estudiante", "arrendador"];
const REQUIRED_VERIFICATION_FILES = {
  estudiante: [
    ["documentoVerificacion", "certificado de alumno regular"],
    ["carnetIdentidadFrontal", "frente del carnet de identidad"],
    ["carnetIdentidadReverso", "reverso del carnet de identidad"],
  ],
  arrendador: [
    ["documentoVerificacion", "frente del carnet de identidad"],
    ["documentoVerificacionReverso", "reverso del carnet de identidad"],
    ["documentoResidencia", "comprobante de residencia"],
    ["fotoPerfil", "foto de perfil"],
  ],
};

function normalizeReviewText(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function buildVerificationPayload(payload) {
  if (typeof payload === "string") {
    return { estadoVerificacion: payload };
  }

  return payload || {};
}

function getMissingVerificationFiles(user) {
  const requiredFiles = REQUIRED_VERIFICATION_FILES[String(user.rol || "").toLowerCase()] || [];
  return requiredFiles
    .filter(([field]) => !user[field])
    .map(([, label]) => label);
}

async function notifyVerificationResult(user, estadoVerificacion, reviewData) {
  let tipo = "verificacion";
  let mensaje = "Tu solicitud de verificacion fue revisada.";
  let sendEmail = null;

  if (estadoVerificacion === "aprobado") {
    tipo = "verificacion_aprobada";
    mensaje = "Tu cuenta fue aprobada. Ya puedes usar ArriendU.";
    sendEmail = () => sendAccountApprovedEmail(user);
  } else if (estadoVerificacion === "rechazado") {
    tipo = "verificacion_rechazada";
    mensaje = `Tu cuenta fue rechazada: ${reviewData.motivoRechazo}`;
    sendEmail = () => sendAccountRejectedEmail(user, reviewData.motivoRechazo);
  } else if (reviewData.solicitudAntecedentes) {
    tipo = "verificacion_antecedentes";
    mensaje = `Necesitamos nuevos antecedentes: ${reviewData.solicitudAntecedentes}`;
    sendEmail = () => sendVerificationInfoRequestEmail(user, reviewData.solicitudAntecedentes);
  }

  await createNotificacionService({
    userId: user.id,
    tipo,
    mensaje,
    targetType: "verificacion",
    targetId: user.id,
  });

  if (sendEmail) {
    try {
      await sendEmail();
      return { correoEnviado: true };
    } catch (emailError) {
      console.error("Error al enviar correo de revision de verificacion:", emailError);
      return { correoEnviado: false };
    }
  }

  return { correoEnviado: false };
}

export async function getUserService(query) {
  try {
    const { rut, id, email } = query;

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
      select: {
        id: true,
        nombreCompleto: true,
        rut: true,
        email: true,
        rol: true,
        estadoVerificacion: true,
        comentarioVerificacion: true,
        motivoRechazo: true,
        solicitudAntecedentes: true,
        verificacionRevisadaEn: true,
        verificacionRevisadaPorId: true,
        password: true,
        avgRating: true,
        reviewsCount: true,
        fotoPerfil: true,
        telefono: true,
        universidad: true,
        carrera: true,
        documentoResidencia: true,
        documentoVerificacion: true,
        documentoVerificacionReverso: true,
        carnetIdentidadFrontal: true,
        carnetIdentidadReverso: true,
        terminosAceptadosEn: true,
        terminosVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const { password, ...userData } = userFound;

    return [userData, null];
  } catch (error) {
    console.error("Error obtener el usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getUsersService() {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const users = await userRepository.find();

    if (!users || users.length === 0) return [null, "No hay usuarios"];

    const usersData = users.map(({ password, ...user }) => user);

    return [usersData, null];
  } catch (error) {
    console.error("Error al obtener a los usuarios:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateUserService(query, body) {
  try {
    const { id, rut, email } = query;

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
      select: {
        id: true,
        nombreCompleto: true,
        rut: true,
        email: true,
        rol: true,
        password: true,
      },
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const existingUser = await userRepository.findOne({
      where: [{ rut: body.rut }, { email: body.email }],
    });

    if (existingUser && existingUser.id !== userFound.id) {
      return [null, "Ya existe un usuario con el mismo rut o email"];
    }

    if (body.password) {
      const matchPassword = await comparePassword(
        body.password,
        userFound.password,
      );

      if (!matchPassword) return [null, "La contrasena no coincide"];
    }

    const dataUserUpdate = {
      nombreCompleto: body.nombreCompleto,
      rut: body.rut,
      email: body.email,
      rol: body.rol,
      updatedAt: new Date(),
    };

    if (body.newPassword && body.newPassword.trim() !== "") {
      dataUserUpdate.password = await encryptPassword(body.newPassword);
    }

    await userRepository.update({ id: userFound.id }, dataUserUpdate);

    const userData = await userRepository.findOne({
      where: { id: userFound.id },
    });

    if (!userData) {
      return [null, "Usuario no encontrado despues de actualizar"];
    }

    const { password, ...userUpdated } = userData;

    return [userUpdated, null];
  } catch (error) {
    console.error("Error al modificar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateUserVerificationStatusService(query, reviewPayload, reviewerId = null) {
  try {
    const { id, rut, email } = query;
    const payload = buildVerificationPayload(reviewPayload);
    const estadoVerificacion = normalizeReviewText(payload.estadoVerificacion).toLowerCase();
    const comentarioVerificacion = normalizeReviewText(
      payload.comentarioVerificacion
      || payload.comentarioRevision
      || payload.comentario
      || payload.motivoRechazo
      || payload.solicitudAntecedentes,
    );
    const motivoRechazo = normalizeReviewText(
      payload.motivoRechazo
      || payload.comentarioRechazo
      || payload.comentarioRevision,
    );
    const solicitudAntecedentes = normalizeReviewText(
      payload.solicitudAntecedentes
      || payload.antecedentesSolicitados
      || payload.comentarioRevision,
    );

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    if (!VERIFICATION_STATUSES.includes(estadoVerificacion)) {
      return [null, "El estado de verificacion debe ser pendiente, aprobado o rechazado"];
    }

    if (!VERIFIABLE_ROLES.includes(String(userFound.rol || "").toLowerCase())) {
      return [null, "Solo se revisan cuentas de estudiantes o arrendadores"];
    }

    if (estadoVerificacion === "rechazado" && !motivoRechazo) {
      return [null, "Debes ingresar un comentario para rechazar la verificacion"];
    }

    if (estadoVerificacion === "aprobado") {
      const missingFiles = getMissingVerificationFiles(userFound);

      if (missingFiles.length > 0) {
        return [null, `No se puede aprobar la cuenta porque faltan: ${missingFiles.join(", ")}`];
      }
    }

    if (estadoVerificacion === "pendiente" && payload.solicitudAntecedentes !== undefined && !solicitudAntecedentes) {
      return [null, "Debes indicar que antecedentes adicionales se solicitan"];
    }

    const hasInfoRequest = estadoVerificacion === "pendiente" && Boolean(solicitudAntecedentes);
    const updateData = {
      estadoVerificacion,
      comentarioVerificacion: comentarioVerificacion || null,
      motivoRechazo: estadoVerificacion === "rechazado" ? motivoRechazo : null,
      solicitudAntecedentes: hasInfoRequest ? solicitudAntecedentes : null,
      verificacionRevisadaEn: new Date(),
      verificacionRevisadaPorId: reviewerId,
      updatedAt: new Date(),
    };

    await userRepository.update(
      { id: userFound.id },
      updateData,
    );

    const userData = await userRepository.findOne({
      where: { id: userFound.id },
    });

    if (!userData) {
      return [null, "Usuario no encontrado despues de actualizar"];
    }

    const { password, ...userUpdated } = userData;

    try {
      const notificationResult = await notifyVerificationResult(userUpdated, estadoVerificacion, {
        motivoRechazo,
        solicitudAntecedentes,
      });

      userUpdated.avisoCorreoEnviado = notificationResult.correoEnviado;
    } catch (notificationError) {
      console.error("Error al enviar aviso de revision de verificacion:", notificationError);
      userUpdated.avisoCorreoEnviado = false;
    }

    return [userUpdated, null];
  } catch (error) {
    console.error("Error al actualizar estado de verificacion:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function deleteUserService(query) {
  try {
    const { id, rut, email } = query;

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    if (userFound.rol === "admin") {
      return [null, "No se puede eliminar un usuario con rol de administrador"];
    }

    const userDeleted = await userRepository.remove(userFound);
    await removeVerificationUploadsForUser(userFound.id);

    const { password, ...dataUser } = userDeleted;

    return [dataUser, null];
  } catch (error) {
    console.error("Error al eliminar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateProfileService(id, body) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({ 
      where: { id },
      select: ['id', 'nombreCompleto', 'universidad', 'carrera', 'telefono', 'fotoPerfil', 'password', 'email']
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    if (body.email && body.email !== userFound.email) {
      const existingEmail = await userRepository.findOne({ where: { email: body.email } });
      if (existingEmail && existingEmail.id !== userFound.id) {
        return [null, "El correo ya está en uso por otro usuario"];
      }
    }

    const dataToUpdate = {
      ...(body.nombreCompleto && { nombreCompleto: body.nombreCompleto }),
      ...(body.universidad && { universidad: body.universidad }),
      ...(body.carrera && { carrera: body.carrera }),
      ...(body.telefono && { telefono: body.telefono }),
      ...(body.fotoPerfil && { fotoPerfil: body.fotoPerfil }),
      ...(body.email && { email: body.email }),
      updatedAt: new Date(),
    };

    if (body.newPassword && body.newPassword.trim() !== '') {
      dataToUpdate.password = await encryptPassword(body.newPassword);
    }

    await userRepository.update({ id: userFound.id }, dataToUpdate);

    const userData = await userRepository.findOne({ where: { id: userFound.id } });

    if (!userData) return [null, "Usuario no encontrado despues de actualizar"];

    if (body.newPassword) {
      try {
        await sendCredentialChangedEmail(
          { email: userFound.email, nombreCompleto: userFound.nombreCompleto },
          ['password']
        );
      } catch (emailError) {
        console.error("Error al enviar correo de aviso:", emailError);
      }
    }

    if (body.email && body.email !== userFound.email) {
      try {
        await sendCredentialChangedEmail(
          { email: userFound.email, nombreCompleto: userFound.nombreCompleto },
          ['email']
        );
      } catch (emailError) {
        console.error("Error al enviar correo de aviso:", emailError);
      }
    }

    const { password, ...userUpdated } = userData;

    return [userUpdated, null];
  } catch (error) {
    console.error("Error al actualizar el perfil del usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getProfileService(id) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({ where: { id } });

    if (!userFound) return [null, "Usuario no encontrado"];

    const { password, ...userData } = userFound;

    return [userData, null];
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateArrendadorProfileService(id, body) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({ 
      where: { id },
      select: ['id', 'nombreCompleto', 'email', 'telefono', 'fotoPerfil', 'rol', 'estadoVerificacion', 'password']
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    if ((body.email && body.email !== userFound.email) || body.newPassword) {
      if (!body.passwordActual) {
        return [null, "Se requiere la contraseña actual para cambiar las credenciales"];
      }
      const isMatch = await comparePassword(body.passwordActual, userFound.password);
      if (!isMatch) return [null, "Contraseña incorrecta"];
    }

    delete body.passwordActual;

    if (body.email && body.email !== userFound.email) {
      const existingEmail = await userRepository.findOne({ where: { email: body.email } });

      if (existingEmail && existingEmail.id !== userFound.id) {
        return [null, "El correo ya esta en uso por otro usuario"];
      }
    }

    const dataToUpdate = {
      ...(body.nombreCompleto && { nombreCompleto: body.nombreCompleto }),
      ...(body.email && { email: body.email }),
      ...(body.telefono && { telefono: body.telefono }),
      ...(body.fotoPerfil && { fotoPerfil: body.fotoPerfil }),
      updatedAt: new Date(),
    };

    if (body.newPassword && body.newPassword.trim() !== '') {
      dataToUpdate.password = await encryptPassword(body.newPassword);
    }

    await userRepository.update({ id: userFound.id }, dataToUpdate);

    const userData = await userRepository.findOne({ where: { id: userFound.id } });

    if (!userData) return [null, "Usuario no encontrado despues de actualizar"];

    const { password, ...userUpdated } = userData;

    if (body.email && body.email !== userFound.email) {
      try {
        await sendCredentialChangedEmail(
          { email: userFound.email, nombreCompleto: userFound.nombreCompleto },
          ['email']
        );
      } catch (emailError) {
        console.error("Error al enviar correo de aviso:", emailError);
      }
    }

    if (body.newPassword) {
      try {
        await sendCredentialChangedEmail(
          { email: userFound.email, nombreCompleto: userFound.nombreCompleto },
          ['password']
        );
      } catch (emailError) {
        console.error("Error al enviar correo de aviso:", emailError);
      }
    }

    return [userUpdated, null];
  } catch (error) {
    console.error("Error al actualizar perfil del arrendador:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function verifyPasswordService(id, password) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({ 
      where: { id },
      select: ['id', 'password']
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const isMatch = await comparePassword(password, userFound.password);

    if (!isMatch) return [null, "Contraseña incorrecta"];

    return [true, null];
  } catch (error) {
    console.error("Error al verificar contraseña:", error);
    return [null, "Error interno del servidor"];
  }
}
