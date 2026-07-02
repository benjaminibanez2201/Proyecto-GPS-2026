"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  contactarPublicacion,
  eliminarConversacion,
  listarConversaciones,
  marcarComoLeido,
  obtenerDetalleConversacion,
  responderConversacion,
} from "../controllers/mensaje.controller.js";

const router = Router();

router.use(authenticateJwt);

router.post("/contacto", contactarPublicacion);
router.get("/conversaciones", listarConversaciones);
router.get("/conversaciones/:id", obtenerDetalleConversacion);
router.post("/conversaciones/:id/mensajes", responderConversacion);
router.post("/conversaciones/:id/leido", marcarComoLeido);
router.delete("/conversaciones/:id", eliminarConversacion);

export default router;
