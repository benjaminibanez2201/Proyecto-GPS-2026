"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

import {
  eliminarNotificacion,
  getNotificacionesByUserId,
  getNotificacionesNoLeidasCount,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from "../controllers/notificacion.controller.js";
const router = Router();

router.use(authenticateJwt);

router
  .get("/notificaciones", getNotificacionesByUserId)
  .get("/notificaciones/count", getNotificacionesNoLeidasCount)
  .patch("/notificaciones/:id/leer", marcarNotificacionLeida)
  .patch("/notificaciones/leer-todas", marcarTodasNotificacionesLeidas)
  .delete("/notificaciones/:id", eliminarNotificacion);

export default router;
