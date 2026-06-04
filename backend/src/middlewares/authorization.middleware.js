"use strict";
import { handleErrorClient } from "../handlers/responseHandlers.js";

export function isAdmin(req, res, next) {
  if (req.user?.rol !== "admin") {
    return handleErrorClient(
      res,
      403,
      "Error al acceder al recurso",
      "Se requiere un rol de administrador para realizar esta accion.",
    );
  }

  next();
}
