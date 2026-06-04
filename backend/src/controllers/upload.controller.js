"use strict";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import {
  getStoredVerificationFilename,
  resolveVerificationFilePath,
} from "../helpers/upload.helper.js";
import {
  handleErrorClient,
  handleErrorServer,
} from "../handlers/responseHandlers.js";

export async function getVerificationFile(req, res) {
  try {
    const userId = Number(req.params.userId);
    const { filename } = req.params;

    if (!Number.isInteger(userId) || userId <= 0) {
      return handleErrorClient(res, 400, "Error de validacion", "Usuario invalido");
    }

    const canViewFile = req.user?.rol === "admin" || Number(req.user?.id) === userId;

    if (!canViewFile) {
      return handleErrorClient(res, 403, "Error al acceder al archivo", "No tienes permiso para ver este archivo.");
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return handleErrorClient(res, 404, "Archivo no encontrado", "Usuario no encontrado.");
    }

    const allowedFilenames = [
      getStoredVerificationFilename(user.documentoResidencia),
      getStoredVerificationFilename(user.fotoPerfil),
      getStoredVerificationFilename(user.documentoVerificacion),
    ].filter(Boolean);

    if (!allowedFilenames.includes(filename)) {
      return handleErrorClient(res, 404, "Archivo no encontrado", "El archivo no esta asociado a este usuario.");
    }

    const filePath = resolveVerificationFilePath(userId, filename);

    if (!filePath) {
      return handleErrorClient(res, 400, "Error de validacion", "Nombre de archivo invalido.");
    }

    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) {
        return handleErrorClient(res, 404, "Archivo no encontrado", "No se pudo abrir el archivo solicitado.");
      }

      return undefined;
    });
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}
