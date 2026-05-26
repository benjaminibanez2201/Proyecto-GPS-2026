"use strict";
import { loginService, registerService } from "../services/auth.service.js";
import {
  authValidation,
  registerArrendadorValidation,
  registerEstudianteValidation,
  registerValidation,
} from "../validations/auth.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

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

    res.cookie("jwt", accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    handleSuccess(res, 200, "Inicio de sesion exitoso", { token: accessToken });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function register(req, res) {
  try {
    const { body } = req;
    const validation = getRegisterValidation(body);

    if (!validation) {
      return handleErrorClient(res, 400, "Error de validacion", "Rol invalido");
    }

    const { error } = validation.validate(body);

    if (error) {
      return handleErrorClient(res, 400, "Error de validacion", error.message);
    }

    const [newUser, errorNewUser] = await registerService(body);

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
