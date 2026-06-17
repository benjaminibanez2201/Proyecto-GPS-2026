"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { 
  addFavorito, 
  createPublicacion,
  deletePublicacion,
  getFavoritos,
  getPublicacionesPropias,
  removeFavorito,
  updatePublicacion,
} from "../controllers/publicacion.controller.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", createPublicacion); // Req 8
router.get("/favoritos", getFavoritos);
router.post("/:id/favorito", addFavorito);
router.delete("/:id/favorito", removeFavorito);
router.get("/mis-publicaciones", getPublicacionesPropias); // Req 28
router.put("/:id", updatePublicacion); // Req 9
router.delete("/:id", deletePublicacion); // Req 9

export default router;
