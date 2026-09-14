import { Router } from "express";
import { addCredits, deductCredits, login, logout } from "../controllers/auth.controller.js";

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post("/deduct-credits", deductCredits);
router.post("/add-credits", addCredits);

export default router;