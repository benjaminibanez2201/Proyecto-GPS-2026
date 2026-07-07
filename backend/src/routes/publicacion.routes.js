"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  cancelarPatrocinioPublicacion,
  createPublicacion,
  deletePublicacion,
  geocodificarUbicacion,
  getPublicacionById,
  getPublicaciones,
  getPublicacionesPropias,
  patrocinarPublicacion,
  updatePublicacion,
} from "../controllers/publicacion.controller.js";
import { parsePublicacionUploads } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", parsePublicacionUploads, createPublicacion); 
router.get("/", getPublicaciones);
router.get("/mis-publicaciones", getPublicacionesPropias);
router.get("/geocodificar", geocodificarUbicacion);
router.post("/:id/patrocinio", patrocinarPublicacion);
router.delete("/:id/patrocinio", cancelarPatrocinioPublicacion);
router.get("/:id", getPublicacionById);
router.put("/:id", parsePublicacionUploads, updatePublicacion); 
router.delete("/:id", deletePublicacion); 

export default router;
