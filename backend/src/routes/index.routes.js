"use strict";
import { Router } from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import rentalsRoutes from "./rentals.routes.js";
import reviewsRoutes from "./reviews.routes.js";
import mensajeRoutes from "./mensaje.routes.js";
import reportesRoutes from "./reportes.routes.js";
import notificacionRoutes from "./notificacion.routes.js";
import publicacionRoutes from "./publicacion.routes.js";
import uploadRoutes from "./upload.routes.js";


const router = Router();
router
    .use("/auth", authRoutes)
    .use("/user", userRoutes)
    .use("/profile", profileRoutes)
    .use("/rentals", rentalsRoutes)
    .use("/reviews", reviewsRoutes)
    .use("/mensajes", mensajeRoutes)
    .use("/reportes", reportesRoutes)
export default router;

    .use("/publicacion", publicacionRoutes);

export default router;
