"use strict";
import { randomUUID } from "crypto";
import multer from "multer";
import fs from "fs";
import {
  getUploadExtension,
  MAX_VERIFICATION_FILE_SIZE,
  removeUploadedTempFiles,
  tmpUploadDir,
  uploadFieldConfig,
} from "../helpers/upload.helper.js";
import { handleErrorClient } from "../handlers/responseHandlers.js";

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(tmpUploadDir, { recursive: true });
    cb(null, tmpUploadDir);
  },
  filename(_req, file, cb) {
    cb(null, `${Date.now()}-${randomUUID()}${getUploadExtension(file)}`);
  },
});

function fileFilter(_req, file, cb) {
  const config = uploadFieldConfig[file.fieldname];

  if (!config) {
    return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
  }

  if (!config.allowedTypes.includes(file.mimetype)) {
    return cb(new Error(`${config.label} tiene un formato no permitido.`));
  }

  return cb(null, true);
}

const registerUpload = multer({
  fileFilter,
  limits: {
    fileSize: MAX_VERIFICATION_FILE_SIZE,
    files: 4,
  },
  storage,
}).fields([
  { maxCount: 1, name: "fotoPerfil" },
  { maxCount: 1, name: "documentoVerificacion" },
  { maxCount: 1, name: "documentoVerificacionReverso" },
  { maxCount: 1, name: "carnetIdentidadFrontal" },
  { maxCount: 1, name: "carnetIdentidadReverso" },
  { maxCount: 1, name: "documentoResidencia" },
]);

const profilePhotoUpload = multer({
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"), false);
    }
  },
  limits: {
    fileSize: MAX_VERIFICATION_FILE_SIZE,
    files: 1,
  },
  storage,
}).single("fotoPerfil");

const publicacionUpload = multer({
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"), false);
    }
  },
  limits: {
    fileSize: MAX_VERIFICATION_FILE_SIZE,
    files: 10,
  },
  storage,
}).fields([
  { maxCount: 10, name: "fotosPublicacion" },
]);

function formatUploadError(error) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return `Cada archivo debe pesar maximo ${MAX_VERIFICATION_FILE_SIZE / 1024 / 1024} MB.`;
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return "Solo se permiten los archivos requeridos para la verificacion.";
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return "El archivo adjunto no corresponde a un campo permitido.";
    }
  }

  return error.message || "No se pudo procesar el archivo adjunto.";
}

export function parseRegisterUploads(req, res, next) {
  registerUpload(req, res, async (error) => {
    if (error) {
      await removeUploadedTempFiles(req.files);
      return handleErrorClient(res, 400, "Error de archivo", formatUploadError(error));
    }

    return next();
  });
}

export function parseProfilePhotoUpload(req, res, next) {
  profilePhotoUpload(req, res, async (error) => {
    if (error) {
      await removeUploadedTempFiles(req.file ? { fotoPerfil: [req.file] } : {});
      return handleErrorClient(res, 400, "Error de archivo", formatUploadError(error));
    }
    return next();
  });
}

export function parsePublicacionUploads(req, res, next) {
  publicacionUpload(req, res, async (error) => {
    if (error) {
      await removeUploadedTempFiles(req.files);
      return handleErrorClient(res, 400, "Error de archivo", formatUploadError(error));
    }
    return next();
  });
}
