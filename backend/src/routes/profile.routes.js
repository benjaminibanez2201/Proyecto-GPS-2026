"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  getProfile,
  getProfileById,
  updateArrendadorProfile,
  updateProfile,
  verifyPassword,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authenticateJwt);

router.get("/", getProfile);
router.get("/:id", getProfileById);
router.patch("/", updateProfile);
router.patch("/arrendador", updateArrendadorProfile);
router.post("/verify-password", verifyPassword);

export default router;
