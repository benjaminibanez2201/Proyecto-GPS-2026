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
import favoritoRoutes from "./favorito.route.js";
import auditoriaRoutes from "./auditoria.routes.js";

const router = Router();
router
    .use("/auth", authRoutes)
    .use("/user", userRoutes)
    .use("/profile", profileRoutes)
    .use("/rentals", rentalsRoutes)
    .use("/reviews", reviewsRoutes)
    .use("/mensajes", mensajeRoutes)
    .use("/reportes", reportesRoutes)
    .use("/notificaciones", notificacionRoutes)
    .use("/publicacion", publicacionRoutes)
    .use("/uploads", uploadRoutes)
    .use("/favoritos", favoritoRoutes);
    router.use("/auditoria", auditoriaRoutes);

export default router;
