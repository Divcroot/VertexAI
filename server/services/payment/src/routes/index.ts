import { Router } from "express";

import {
	createOrder,
	verifyPayment,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/orders", createOrder);
router.post("/verify", verifyPayment);

export default router;