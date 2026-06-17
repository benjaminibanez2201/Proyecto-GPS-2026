"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import publicacionController from "../controllers/publicacion.controller.js";

const router = Router();

router.use(authenticateJwt);

router.get("/:id_publicacion", publicacionController.obtenerDetallePublicacion);
router.post("/:id_publicacion/favoritos", publicacionController.agregarFavorito);
router.delete("/:id_publicacion/favoritos", publicacionController.eliminarFavorito);

export default router;