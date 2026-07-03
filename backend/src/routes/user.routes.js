"use strict";
import { Router } from "express";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser,
  updateUserVerificationStatus,
  toggleUserStatus,
} from "../controllers/user.controller.js";

const router = Router();

router
  .use(authenticateJwt)
  .use(isAdmin);

router
  .get("/", getUsers)
  .get("/detail/", getUser)
  .patch("/detail/verification", updateUserVerificationStatus)
  .patch("/detail/", updateUser)
  .patch("/detail/status", toggleUserStatus)
  .delete("/detail/", deleteUser);

export default router;
