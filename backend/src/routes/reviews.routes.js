"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { crearResena, obtenerResenasPorUsuario } from "../controllers/reviews.controller.js";
import { obtenerResena, actualizarResena, eliminarResena } from "../controllers/reviews.controller.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", crearResena);
router.get("/user/:id", obtenerResenasPorUsuario);
router.get("/:id", obtenerResena);
router.put("/:id", actualizarResena);
router.delete("/:id", eliminarResena);

export default router;
