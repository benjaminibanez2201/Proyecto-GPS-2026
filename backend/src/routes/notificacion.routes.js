"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

import {
    getNotificacionesByUserId,
    getNotificacionesNoLeidasCount,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    eliminarNotificacion,
} from "../controllers/notificacion.controller.js";
const router = Router();

router.use(authenticateJwt);

router
  .get("/", getNotificacionesByUserId)
  .get("/count", getNotificacionesNoLeidasCount)
  .patch("/:id/leer", marcarNotificacionLeida)
  .patch("/leer-todas", marcarTodasNotificacionesLeidas)
  .delete("/:id", eliminarNotificacion);

export default router;
