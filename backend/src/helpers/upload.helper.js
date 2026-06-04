"use strict";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadRoot = path.resolve(__dirname, "../../uploads");
export const tmpUploadDir = path.join(uploadRoot, "tmp");
export const verificationUploadDir = path.join(uploadRoot, "verifications");
export const MAX_VERIFICATION_FILE_SIZE = 8 * 1024 * 1024;

export const uploadFieldConfig = {
  documentoVerificacion: {
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
    label: "El documento de verificacion",
  },
  fotoPerfil: {
    allowedTypes: ["image/jpeg", "image/png"],
    label: "La foto de perfil",
  },
};

const extensionByMimeType = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

function flattenFiles(files = {}) {
  return Object.values(files).flat().filter(Boolean);
}

export function getUploadExtension(file) {
  return extensionByMimeType[file.mimetype] || path.extname(file.originalname).toLowerCase();
}

export function toUploadedFileMetadata(file) {
  if (!file) return null;

  return {
    name: file.originalname,
    size: file.size,
    type: file.mimetype,
  };
}

export async function removeUploadedTempFiles(files = {}) {
  const uploadedFiles = flattenFiles(files);

  await Promise.all(uploadedFiles.map(async (file) => {
    if (!file?.path) return;

    try {
      await fs.unlink(file.path);
    } catch {
      // El archivo pudo moverse o eliminarse antes.
    }
  }));
}

export function buildVerificationFileUrl(userId, filename) {
  return `/api/uploads/verifications/${userId}/${encodeURIComponent(filename)}`;
}

export async function commitVerificationUploads(userId, files = {}) {
  const userUploadDir = path.join(verificationUploadDir, String(userId));
  const stored = {};
  const storedPaths = [];

  await fs.mkdir(userUploadDir, { recursive: true });

  for (const fieldName of Object.keys(uploadFieldConfig)) {
    const file = files[fieldName]?.[0];

    if (!file) continue;

    const finalFilename = `${fieldName}-${Date.now()}-${randomUUID()}${getUploadExtension(file)}`;
    const finalPath = path.join(userUploadDir, finalFilename);

    await fs.rename(file.path, finalPath);
    stored[fieldName] = buildVerificationFileUrl(userId, finalFilename);
    storedPaths.push(finalPath);
  }

  return { stored, storedPaths };
}

export async function removeStoredFiles(filePaths = []) {
  await Promise.all(filePaths.map(async (filePath) => {
    try {
      await fs.unlink(filePath);
    } catch {
      // Si no existe, no bloqueamos la operación principal.
    }
  }));
}

export async function removeVerificationUploadsForUser(userId) {
  const userUploadDir = path.join(verificationUploadDir, String(userId));

  await fs.rm(userUploadDir, { force: true, recursive: true });
}

export function getStoredVerificationFilename(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") return null;

  return path.basename(decodeURIComponent(fileUrl));
}

export function resolveVerificationFilePath(userId, filename) {
  const safeFilename = path.basename(filename);
  const userUploadDir = path.resolve(verificationUploadDir, String(userId));
  const filePath = path.resolve(userUploadDir, safeFilename);

  if (!filePath.startsWith(`${userUploadDir}${path.sep}`)) return null;

  return filePath;
}
