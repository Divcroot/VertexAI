import { Router } from "express";

import {
    authServiceProxy,
    fileServiceProxy,
    projectServiceProxy,
    aiServiceProxy,
    terminalServiceProxy,
    paymentServiceProxy,
} from "../proxy/service.proxy.js";
import { protect } from "../middlewares/protect.middleware.js";
import { getCurrentUser } from "../controllers/user.controller.js";

const router = Router();

router.use("/auth", authServiceProxy);
router.get('/user/me', protect, getCurrentUser)
router.use("/files", protect, fileServiceProxy);
router.use("/projects", protect, projectServiceProxy);
router.use("/ai", protect, aiServiceProxy);
router.use("/terminal", protect, terminalServiceProxy);
router.use("/payment", protect, paymentServiceProxy);

export default router;