"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  anularArriendo,
  confirmarArriendo,
  crearArriendo,
  obtenerArriendo,
} from "../controllers/rentals.controller.js";
import {
  actualizarArriendo,
  eliminarArriendo,
  listarArriendos,
} from "../controllers/rentals.controller.js";

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
router.post("/:id/cancel", anularArriendo);

export default router;
