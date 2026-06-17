"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import reportesController from "../controllers/reportes.controller.js";

const router = Router();

// Estudiante reporta publicación
router.post("/publicacion", authenticateJwt, reportesController.crearReportePublicacion);

// Listado de publicaciones reportadas (solo admin)
router.get("/", authenticateJwt, isAdmin, reportesController.listarReportes);

// Detalle de reporte
router.get("/:id", authenticateJwt, isAdmin, reportesController.detalleReporte);

// Resolver reportes para una publicación
router.patch("/:id_publicacion/review", authenticateJwt, isAdmin, reportesController.reviewReporte);

export default router;
