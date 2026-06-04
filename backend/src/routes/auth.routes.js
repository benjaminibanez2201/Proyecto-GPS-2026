"use strict";
import { Router } from "express";
import { forgotPassword, login, logout, register, resetPassword } from "../controllers/auth.controller.js";
import { parseRegisterUploads } from "../middlewares/upload.middleware.js";
const router = Router();

router
  .post("/login", login)
  .post("/register", parseRegisterUploads, register)
  .post("/logout", logout)
  .post("/forgot-password", forgotPassword)
  .post("/reset-password/:token", resetPassword);

export default router;
