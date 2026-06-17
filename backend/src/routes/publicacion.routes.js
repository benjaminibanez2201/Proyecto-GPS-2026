"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { 
  createPublicacion, 
  getPublicacionesPropias,
  updatePublicacion,
  deletePublicacion
} from "../controllers/publicacion.controller.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", createPublicacion); // Req 8
router.get("/mis-publicaciones", getPublicacionesPropias); // Req 28
router.put("/:id", updatePublicacion); // Req 9
router.delete("/:id", deletePublicacion); // Req 9

export default router;
