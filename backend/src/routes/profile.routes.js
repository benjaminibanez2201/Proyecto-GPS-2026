"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { updateProfile, getPublicProfile } from "../controllers/user.controller.js";

const router = Router();

router.use(authenticateJwt);

router.patch("/", updateProfile);
router.get("/:id", getPublicProfile);

export default router;