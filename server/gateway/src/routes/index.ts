import { Router } from "express";

import { getCurrentUser } from "../controllers/user.controller.js";
import { protect } from "../middlewares/protect.middleware.js";
import {
    aiServiceProxy,
    authServiceProxy,
    fileServiceProxy,
    paymentServiceProxy,
    projectServiceProxy,
    terminalServiceProxy,
} from "../proxy/service.proxy.js";

const router = Router();

// Auth routes
router.use("/auth", authServiceProxy);

// Current user
router.get(
    "/user/me",
    protect,
    getCurrentUser,
);

// Protected services
router.use(
    "/files",
    protect,
    fileServiceProxy,
);

router.use(
    "/projects",
    protect,
    projectServiceProxy,
);

router.use(
    "/ai",
    protect,
    aiServiceProxy,
);

router.use(
    "/terminal",
    protect,
    terminalServiceProxy,
);

router.use(
    "/payment",
    protect,
    paymentServiceProxy,
);

export default router;