"use strict";
import {
  deleteUserService,
  getProfileService,
  getPublicProfileService,
  getUserService,
  getUsersService,
  toggleUserStatusService,
  updateArrendadorProfileService,
  updateProfileService,
  updateUserService,
  updateUserVerificationStatusService,
  verifyPasswordService,
} from "../services/user.service.js";
import {
  profileArrendadorBodyValidation,
  profileBodyValidation,
  userBodyValidation,
  userQueryValidation,
} from "../validations/user.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { commitProfilePhotoUpload } from "../helpers/upload.helper.js";
import { isValidPublicId } from "../helpers/publicId.helper.js";

function agregarPublicId(user) {
  if (!user) return user;
  return { ...user, publicId: user.uuid };
}

export async function getUser(req, res) {
  try {
    const { rut, id, email } = req.query;

    const { error } = userQueryValidation.validate({ rut, id, email });

    if (error) return handleErrorClient(res, 400, error.message);

    const [user, errorUser] = await getUserService({ rut, id, email });

    if (errorUser) return handleErrorClient(res, 404, errorUser);

    handleSuccess(res, 200, "Usuario encontrado", agregarPublicId(user));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getUsers(req, res) {
  try {
    const [users, errorUsers] = await getUsersService();

    if (errorUsers) return handleErrorClient(res, 404, errorUsers);

    users.length === 0
      ? handleSuccess(res, 204)
      : handleSuccess(res, 200, "Usuarios encontrados", users.map(agregarPublicId));
  } catch (error) {
    handleErrorServer(
      res,
      500,
      error.message,
    );
  }
}

export async function updateUser(req, res) {
  try {
    const { rut, id, email } = req.query;
    const { body } = req;

    const { error: queryError } = userQueryValidation.validate({
      rut,
      id,
      email,
    });

    if (queryError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en la consulta",
        queryError.message,
      );
    }

    const { error: bodyError } = userBodyValidation.validate(body);

    if (bodyError)
      return handleErrorClient(
        res,
        400,
        "Error de validación en los datos enviados",
        bodyError.message,
      );

    const [user, userError] = await updateUserService({ rut, id, email }, body,req.user?.id || null);

    if (userError) return handleErrorClient(res, 400, "Error modificando al usuario", userError);

    handleSuccess(res, 200, "Usuario modificado correctamente", agregarPublicId(user));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateUserVerificationStatus(req, res) {
  try {
    const { rut, id, email } = req.query;
    const estadoVerificacion = String(req.body?.estadoVerificacion || "").toLowerCase();

    const { error: queryError } = userQueryValidation.validate({
      rut,
      id,
      email,
    });

    if (queryError) {
      return handleErrorClient(
        res,
        400,
        "Error de validacion en la consulta",
        queryError.message,
      );
    }

    if (!["pendiente", "aprobado", "rechazado"].includes(estadoVerificacion)) {
      return handleErrorClient(
        res,
        400,
        "Error de validacion en los datos enviados",
        "El estado de verificacion debe ser pendiente, aprobado o rechazado.",
      );
    }

    const [user, userError] = await updateUserVerificationStatusService(
      { rut, id, email },
      {
        ...req.body,
        estadoVerificacion,
      },
      req.user?.id || null,
    );

    if (userError) return handleErrorClient(res, 400, "Error modificando estado del usuario", userError);

    handleSuccess(res, 200, "Estado de verificacion actualizado correctamente", agregarPublicId(user));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteUser(req, res) {
  try {
    const { rut, id, email } = req.query;
    const adminId = req.user?.id;
    const { error: queryError } = userQueryValidation.validate({
      rut,
      id,
      email,
    });

    if (queryError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en la consulta",
        queryError.message,
      );
    }

    const [userDelete, errorUserDelete] = await deleteUserService({ 
      rut, 
      id, 
      email
     }, adminId);

    if (errorUserDelete) return handleErrorClient(res, 404, "Error eliminado al usuario", errorUserDelete);

    handleSuccess(res, 200, "Usuario eliminado correctamente", agregarPublicId(userDelete));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateProfile(req, res) {
  try {
    const { body, file } = req;
    const { id } = req.user;

    if (file) {
      body.fotoPerfil = await commitProfilePhotoUpload(id, file);
    }

    const { error: bodyError } = profileBodyValidation.validate(body);

    if (bodyError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en los datos enviados",
        bodyError.message,
      );
    }

    const [user, userError] = await updateProfileService(id, body);

    if (userError) return handleErrorClient(res, 400, "Error actualizando perfil", userError);

    handleSuccess(res, 200, "Perfil actualizado correctamente", agregarPublicId(user));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getPublicProfile(req, res) {
  try {
    const { id } = req.params;

    if (!id) return handleErrorClient(res, 400, "Se requiere id de usuario");

    const [user, errorUser] = await getUserService({ id });

    if (errorUser) return handleErrorClient(res, 404, errorUser);

    // Filtrar solo campos públicos
    const publicProfile = {
      id: user.id,
      nombreCompleto: user.nombreCompleto,
      rol: user.rol,
      fotoPerfil: user.fotoPerfil || null,
      avgRating: user.avgRating || 0,
      reviewsCount: user.reviewsCount || 0,
    };

    handleSuccess(res, 200, "Perfil público encontrado", publicProfile);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getProfile(req, res) {
  try {
    const { id } = req.user;

    const [user, userError] = await getProfileService(id);

    if (userError) return handleErrorClient(res, 404, "Error obteniendo perfil", userError);

    handleSuccess(res, 200, "Perfil obtenido correctamente", agregarPublicId(user));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getProfileById(req, res) {
  try {
    const { id: usuarioUuid } = req.params;

    if (!isValidPublicId(usuarioUuid)) {
      return handleErrorClient(res, 400, "ID inválido", "El identificador del perfil no es válido");
    }

    const [user, userError] = await getPublicProfileService(usuarioUuid);

    if (userError) return handleErrorClient(res, 404, "Error obteniendo perfil", userError);

    handleSuccess(res, 200, "Perfil obtenido correctamente", agregarPublicId(user));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateArrendadorProfile(req, res) {
  try {
    const { body, file } = req;
    const { id, rol } = req.user;

    if (file) {
      body.fotoPerfil = await commitProfilePhotoUpload(id, file);
    }

    if (rol !== "arrendador") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los arrendadores pueden acceder a esta función");
    }

    const { error: bodyError } = profileArrendadorBodyValidation.validate(body);

    if (bodyError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en los datos enviados",
        bodyError.message,
      );
    }

    const [user, userError] = await updateArrendadorProfileService(id, body);

    if (userError) return handleErrorClient(res, 400, "Error actualizando perfil", userError);

    handleSuccess(res, 200, "Perfil actualizado correctamente", agregarPublicId(user));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getPerfilPropio(req, res) {
  try {
    const { id, nombre, correo, rol, universidad, carrera, telefono, fotoPerfil, estadoVerificacion } = req.user;
    
    const datosPerfil = {
      id, nombre, correo, rol, fotoPerfil,
      ...(rol === "estudiante" && { universidad, carrera }),
      ...(rol === "arrendador" && { telefono, estadoVerificacion })
    };

    handleSuccess(res, 200, "Perfil obtenido correctamente", datosPerfil);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function verifyPassword(req, res) {
  try {
    const { id } = req.user;
    const { password } = req.body;

    if (!password) {
      return handleErrorClient(res, 400, "La contraseña es obligatoria");
    }

    const [valid, error] = await verifyPasswordService(id, password);

    if (error) return handleErrorClient(res, 400, "Error verificando contraseña", error);

    handleSuccess(res, 200, "Contraseña verificada correctamente", { valid });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const adminId = req.user?.id;
    const rawId = req.query?.id ?? req.body?.id;
    const estadoCuenta = String(req.body?.estadoCuenta ?? req.query?.estadoCuenta ?? "")
      .trim()
      .toLowerCase();
    const id = rawId !== undefined && rawId !== null ? Number(rawId) : null;

    if (req.user?.rol !== "admin") {
      return handleErrorClient(res, 403, "Acceso denegado", "Solo los administradores pueden gestionar el estado de las cuentas");
    }

    if (!Number.isInteger(id) || id <= 0) {
      return handleErrorClient(res, 400, "Error de validación", "Se requiere un id válido del usuario a modificar.");
    }

    if (!estadoCuenta || !["activo", "suspendido"].includes(estadoCuenta)) {
      return handleErrorClient(res, 400, "Error de validación", "El estado de la cuenta debe ser 'activo' o 'suspendido'");
    }

    const [user, error] = await toggleUserStatusService(adminId, id, estadoCuenta);

    if (error) return handleErrorClient(res, 400, "Error modificando estado del usuario", error);

    const mensaje = estadoCuenta === "suspendido"
      ? "Cuenta de usuario suspendida correctamente"
      : "Cuenta de usuario reactivada correctamente";

    handleSuccess(res, 200, mensaje, agregarPublicId(user));
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
