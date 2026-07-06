"use strict";
import { Router } from "express";
import path from "path";
import fs from "fs/promises";
import { getVerificationFile } from "../controllers/upload.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { uploadRoot } from "../helpers/upload.helper.js";

const router = Router();

router.get("/verifications/:userId/:filename", authenticateJwt, getVerificationFile);

router.get("/:folder/:resourceId/:filename", async (req, res) => {
  try {
    const { folder, resourceId, filename } = req.params;
    const allowedFolders = ["perfiles", "publicaciones"];

    if (!allowedFolders.includes(folder)) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    const resolvedPath = path.resolve(uploadRoot, folder, resourceId, filename);
    const rootPath = path.resolve(uploadRoot, folder, resourceId);

    if (!resolvedPath.startsWith(rootPath + path.sep) && resolvedPath !== rootPath) {
      return res.status(400).json({ message: "Nombre de archivo inválido" });
    }

    await fs.access(resolvedPath);
    return res.sendFile(resolvedPath);
  } catch (error) {
    return res.status(404).json({ message: "Archivo no encontrado" });
  }
});

export default router;
