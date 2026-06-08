import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { 
    createFavorito, 
    deleteFavorito, 
    getFavoritos
} from "../controllers/favorito.controller.js";

const router = Router();

router.use(authenticateJwt);

router.get("/", getFavoritos);
router.post("/", createFavorito);
router.delete("/:publicacionId", deleteFavorito);

export default router;