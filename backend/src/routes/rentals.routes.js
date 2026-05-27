"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { crearArriendo, obtenerArriendo, confirmarArriendo } from "../controllers/rentals.controller.js";
import { listarArriendos, actualizarArriendo, eliminarArriendo } from "../controllers/rentals.controller.js";

const router = Router();

router.use(authenticateJwt);

//rutas generales
router.get("/", listarArriendos);
router.post("/", crearArriendo);
//rutas especificas por id
router.get("/:id", obtenerArriendo);
router.put("/:id", actualizarArriendo);
router.delete("/:id", eliminarArriendo);
//confirmacion del arriendo
router.post("/:id/confirm", confirmarArriendo);

export default router;
