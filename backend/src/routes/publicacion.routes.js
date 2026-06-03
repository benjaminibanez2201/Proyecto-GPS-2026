"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { createPublicacion } from "../controllers/publicacion.controller.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", createPublicacion);

export default router;