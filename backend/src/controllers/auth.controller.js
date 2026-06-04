"use strict";
import {
  forgotPasswordService,
  loginService,
  registerService,
  resetPasswordService,
} from "../services/auth.service.js";
import {
  authValidation,
  newPasswordValidation,
  registerArrendadorValidation,
  registerEstudianteValidation,
  registerValidation,
} from "../validations/auth.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import {
  removeUploadedTempFiles,
  toUploadedFileMetadata,
} from "../helpers/upload.helper.js";

function attachRegisterFileMetadata(req) {
  const documentoResidencia = req.files?.documentoResidencia?.[0];
  const fotoPerfil = req.files?.fotoPerfil?.[0];
  const documentoVerificacion = req.files?.documentoVerificacion?.[0];
  const documentoVerificacionReverso = req.files?.documentoVerificacionReverso?.[0];

  if (documentoResidencia) {
    req.body.documentoResidencia = toUploadedFileMetadata(documentoResidencia);
  }

  if (fotoPerfil) {
    req.body.fotoPerfil = toUploadedFileMetadata(fotoPerfil);
  }

  if (documentoVerificacion) {
    req.body.documentoVerificacion = toUploadedFileMetadata(documentoVerificacion);
  }

  if (documentoVerificacionReverso) {
    req.body.documentoVerificacionReverso = toUploadedFileMetadata(documentoVerificacionReverso);
  }
}

function getRegisterValidation(body) {
  if (!body.rol) {
    return registerValidation;
  }

  if (body.rol === "estudiante") {
    return registerEstudianteValidation;
  }

  if (body.rol === "arrendador") {
    return registerArrendadorValidation;
  }

  return null;
}

export async function login(req, res) {
  try {
    const { body } = req;

    const { error } = authValidation.validate(body);

    if (error) {
      return handleErrorClient(res, 400, "Error de validacion", error.message);
    }

    const [accessToken, errorToken] = await loginService(body);

    if (errorToken) return handleErrorClient(res, 400, "Error iniciando sesion", errorToken);

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("jwt", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    handleSuccess(res, 200, "Inicio de sesion exitoso", { token: accessToken });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function register(req, res) {
  try {
    attachRegisterFileMetadata(req);

    const { body } = req;
    const validation = getRegisterValidation(body);

    if (!validation) {
      await removeUploadedTempFiles(req.files);
      return handleErrorClient(res, 400, "Error de validacion", "Rol invalido");
    }

    const { error, value: validatedBody } = validation.validate(body);

    if (error) {
      await removeUploadedTempFiles(req.files);
      return handleErrorClient(res, 400, "Error de validacion", error.message);
    }

    const [newUser, errorNewUser] = await registerService(validatedBody, req.files);

    if (errorNewUser) return handleErrorClient(res, 400, "Error registrando al usuario", errorNewUser);

    handleSuccess(res, 201, "Usuario registrado con exito", newUser);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie("jwt", { httpOnly: true });
    handleSuccess(res, 200, "Sesion cerrada exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const [message, error] = await forgotPasswordService(email);

    if (error) return handleErrorClient(res, 400, "Error solicitando recuperacion", error);

    handleSuccess(res, 200, message);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const { error } = newPasswordValidation.validate({ newPassword });

    if (error) {
      return handleErrorClient(res, 400, "Error de validacion", error.message);
    }

    const [message, errorNewPassword] = await resetPasswordService(token, newPassword);

    if (errorNewPassword) return handleErrorClient(res, 400, "Error restableciendo contrasena", errorNewPassword);

    handleSuccess(res, 200, message);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
