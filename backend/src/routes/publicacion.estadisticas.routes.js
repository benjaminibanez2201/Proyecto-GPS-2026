"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import publicacionEstadisticasController from "../controllers/publicacion.estadisticas.controller.js";

const router = Router();

router.use(authenticateJwt);

router.get("/:id_publicacion/estadisticas", publicacionEstadisticasController.obtenerEstadisticasPublicacion);

export default router;