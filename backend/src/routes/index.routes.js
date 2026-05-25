"use strict";
import { Router } from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import rentalsRoutes from "./rentals.routes.js";
import reviewsRoutes from "./reviews.routes.js";

const router = Router();

router
    .use("/auth", authRoutes)
    .use("/user", userRoutes)
    .use("/rentals", rentalsRoutes)
    .use("/reviews", reviewsRoutes);

export default router;