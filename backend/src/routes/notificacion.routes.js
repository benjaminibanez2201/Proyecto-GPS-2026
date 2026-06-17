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
  .get("/count", getNotificacionesNoLeidasCount)
  .patch("/leer-todas", marcarTodasNotificacionesLeidas)
  .get("/", getNotificacionesByUserId)
  .patch("/:id/leer", marcarNotificacionLeida)
  .delete("/:id", eliminarNotificacion);

export default router;
