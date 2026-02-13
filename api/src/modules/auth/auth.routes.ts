import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import {
    registerBodySchema,
    loginBodySchema,
    forgotPasswordBodySchema,
    resetPasswordBodySchema,
    changePasswordBodySchema,
    refreshBodySchema,
    logoutBodySchema,
    meBodySchema,
} from "./auth.schemas.js";
import { validateBody } from "../../common/middlewares/validateBody.middleware.js";
import { csrfProtection } from "../../common/middlewares/csrf.middleware.js";

const router = Router();

// PUBLIC
router.post("/register",
    csrfProtection,
    validateBody(registerBodySchema),
    authController.register);

router.post("/login",
    csrfProtection,
    validateBody(loginBodySchema),
    authController.login);

router.post("/refresh",
    csrfProtection,
    validateBody(refreshBodySchema),
    authController.refresh);

router.post("/forgot-password",
    csrfProtection,
    validateBody(forgotPasswordBodySchema),
    authController.forgotPassword);

router.post("/reset-password",
    csrfProtection,
    validateBody(resetPasswordBodySchema),
    authController.resetPassword);

// PROTECTED
router.post("/logout",
    authMiddleware,
    csrfProtection,
    validateBody(logoutBodySchema),
    authController.logout);

router.get("/me",
    authMiddleware,
    validateBody(meBodySchema),
    authController.me);

router.post("/change-password",
    csrfProtection,
    authMiddleware,
    validateBody(changePasswordBodySchema),
    authController.changePassword);

export default router;