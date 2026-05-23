"use strict";
import { loginService, registerService, forgotPasswordService, resetPasswordService } from "../services/auth.service.js";
import {
  authValidation,
  registerValidation,
} from "../validations/auth.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function login(req, res) {
  try {
    const { body } = req;

    const { error } = authValidation.validate(body);

    if (error) {
      return handleErrorClient(res, 400, "Error de validación", error.message);
    }
    const [accessToken, errorToken] = await loginService(body);

    if (errorToken) return handleErrorClient(res, 400, "Error iniciando sesión", errorToken);

    res.cookie("jwt", accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    handleSuccess(res, 200, "Inicio de sesión exitoso", { token: accessToken });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function register(req, res) {
  try {
    const { body } = req;

    const { error } = registerValidation.validate(body);

    if (error)
      return handleErrorClient(res, 400, "Error de validación", error.message);

    const [newUser, errorNewUser] = await registerService(body);

    if (errorNewUser) return handleErrorClient(res, 400, "Error registrando al usuario", errorNewUser);

    handleSuccess(res, 201, "Usuario registrado con éxito", newUser);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie("jwt", { httpOnly: true });
    handleSuccess(res, 200, "Sesión cerrada exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const [message, error] = await forgotPasswordService(email);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, message);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    const [message, error] = await resetPasswordService(token, newPassword);
    
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, message);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}