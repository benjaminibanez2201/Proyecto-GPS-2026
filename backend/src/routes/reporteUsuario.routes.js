"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import reporteUsuarioController from "../controllers/reporteUsuario.controller.js";

const router = Router();

// Arrendador o estudiante reporta a la otra persona desde la conversación
router.post("/", authenticateJwt, reporteUsuarioController.crearReporteDeUsuario);

// Historial de reportes de usuario del autenticado
router.get("/mios", authenticateJwt, reporteUsuarioController.misReportesDeUsuario);

// Listado de usuarios reportados (solo admin)
router.get("/", authenticateJwt, isAdmin, reporteUsuarioController.listarReportesUsuario);

// Detalle de reporte
router.get("/:id", authenticateJwt, isAdmin, reporteUsuarioController.detalleReporteUsuario);

// Resolver reportes para un usuario
router.patch("/:id_usuario/review", authenticateJwt, isAdmin, reporteUsuarioController.reviewReporteUsuario);

export default router;
