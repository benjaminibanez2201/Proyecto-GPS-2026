"use strict";
import { Router } from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import mensajeRoutes from "./mensaje.routes.js";

const router = Router();

router
    .use("/auth", authRoutes)
    .use("/user", userRoutes);
    
router.use("/mensajes", mensajeRoutes);

export default router;