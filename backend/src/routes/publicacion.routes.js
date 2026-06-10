"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { 
    createPublicacion,
    getPublicaciones,
    getPublicacionById,
    getMisPublicaciones
 } from "../controllers/publicacion.controller.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", createPublicacion);
router.get("/", getPublicaciones);
router.get("/mis-publicaciones", getMisPublicaciones);
router.get("/:id", getPublicacionById);


export default router;
