import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import {
    registerBodySchema,
    loginBodySchema,
    forgotPasswordSchema,
    resetPasswordBodySchema,
    changePasswordBodySchema,
    refreshBodySchema,
    logoutBodySchema,
    meBodySchema
} from "./auth.schemas.js";
import { validateBody } from "../../common/middlewares/validateBody.middleware.js";

const router = Router();

// PUBLIC
router.post("/register",
    validateBody(registerBodySchema),
    authController.register);

router.post("/login",
    validateBody(loginBodySchema),
    authController.login);

router.post("/refresh",
    validateBody(refreshBodySchema),
    authController.refresh);

router.post("/forgot-password",
    validateBody(forgotPasswordSchema),
    authController.forgotPassword);

router.post("/reset-password",
    validateBody(resetPasswordBodySchema),
    authController.resetPassword);

// PROTECTED
router.post("/logout",
    authMiddleware,
    validateBody(logoutBodySchema),
    authController.logout);

router.get("/me",
    authMiddleware,
    validateBody(meBodySchema),
    authController.me);

router.post("/change-password",
    authMiddleware,
    validateBody(changePasswordBodySchema),
    authController.changePassword);

export default router;