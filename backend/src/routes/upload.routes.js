"use strict";
import { Router } from "express";
import { getVerificationFile } from "../controllers/upload.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router
  .use(authenticateJwt)
  .get("/verifications/:userId/:filename", getVerificationFile);

export default router;
