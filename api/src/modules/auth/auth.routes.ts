import { Router } from "express";
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
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AuthRepo } from "./auth.repo.js";
import { EmailService } from "../mail/mail.service.js";
import { prisma } from "../../db/prisma.js";

const router = Router();

const authController = new AuthController(
    new AuthService(
        new EmailService(),
        new AuthRepo(),
        prisma
    )
);

// PUBLIC
router.post("/register",
    validateBody(registerBodySchema),
    authController.register);

router.post("/login",
    validateBody(loginBodySchema),
    authController.login);

router.post("/refresh",
    csrfProtection,
    validateBody(refreshBodySchema),
    authController.refresh);

router.post("/forgot-password",
    validateBody(forgotPasswordBodySchema),
    authController.forgotPassword);

router.post("/reset-password",
    validateBody(resetPasswordBodySchema),
    authController.resetPassword);

// PROTECTED
router.post("/logout",
    csrfProtection,
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