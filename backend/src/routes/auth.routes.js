"use strict";
import { Router } from "express";
import {
  confirmEmail,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
} from "../controllers/auth.controller.js";
import { parseRegisterUploads } from "../middlewares/upload.middleware.js";
const router = Router();

router
  .post("/login", login)
  .post("/register", parseRegisterUploads, register)
  .post("/logout", logout)
  .get("/confirm-email/:token", confirmEmail)
  .get("/verify-email/:token", confirmEmail)
  .post("/forgot-password", forgotPassword)
  .post("/reset-password/:token", resetPassword);

export default router;
