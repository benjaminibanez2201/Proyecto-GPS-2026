"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { crearArriendo, obtenerArriendo, confirmarArriendo } from "../controllers/rentals.controller.js";
import { listarArriendos, actualizarArriendo, eliminarArriendo } from "../controllers/rentals.controller.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", crearArriendo);
router.get("/:id", obtenerArriendo);
router.post("/:id/confirm", confirmarArriendo);
router.get("/", listarArriendos);
router.put("/:id", actualizarArriendo);
router.delete("/:id", eliminarArriendo);

export default router;
