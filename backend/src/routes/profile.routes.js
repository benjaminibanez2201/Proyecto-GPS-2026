"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { updateProfile, getProfile, updateArrendadorProfile, verifyPassword } from "../controllers/user.controller.js";

const router = Router();

router.use(authenticateJwt);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/arrendador", updateArrendadorProfile);
router.post("/verify-password", verifyPassword);

export default router;
