"use strict";
import { Router } from "express";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { getAuditoria } from "../controllers/auditoria.controller.js";

const router = Router();

router
  .use(authenticateJwt)
  .use(isAdmin);

router
  .get("/", getAuditoria);

export default router;