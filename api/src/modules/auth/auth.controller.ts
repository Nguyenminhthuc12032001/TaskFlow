import { Request, Response } from "express";
import { loginResponseSchema, refreshResponseSchema, registerResponseSchema, safeUserSchema, type ChangePasswordBody, type ForgotPasswordBody, type LoginBody, type LoginResponse, type RefreshResponse, type RegisterBody, type RegisterResponse, type ResetPasswordBody, type SafeUserResponse } from "./auth.schemas.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { validateResponse } from "../../common/utils/response/validate.js";
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from "../../common/utils/response/format.js";
import type { AuthService } from "./auth.service.js";

export class AuthController {
    constructor(
        private authService: AuthService,
    ) {}
    
    register = async (req: Request<{}, {}, RegisterBody>, res: Response) => {
        const result = await this.authService.register(req.body);

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        });

        const registerResponse: RegisterResponse = {
            user: result.safeUser,
            accessToken: result.accessToken
        }

        const envelope = created(registerResponse);
        const validatedEnvelope = validateResponse(createdEnvelopeSchema(registerResponseSchema))(envelope);

        return res.status(201).json(validatedEnvelope);
    }

    login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
        const result = await this.authService.login(req.body);

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        })

        const loginResponse: LoginResponse = {
            user: result.safeUser,
            accessToken: result.accessToken
        }

        const envelope = ok(loginResponse);
        const validatedEnvelope = validateResponse(okEnvelopeSchema(loginResponseSchema))(envelope);

        return res.status(200).json(validatedEnvelope);
    }

    logout = async (req: Request, res: Response) => {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) return res.sendStatus(204);

        await this.authService.logout(refreshToken);

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        })

        return res.sendStatus(204);
    }

    refresh = async (req: Request, res: Response) => {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new AppError("Refresh token missing", 401);
        }

        const result = await this.authService.refresh(refreshToken);

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        })

        const refreshResponse: RefreshResponse = {
            accessToken: result.accessToken
        }

        const envelope = ok(refreshResponse);
        const validatedEnvelope = validateResponse(okEnvelopeSchema(refreshResponseSchema))(envelope);

        return res.status(200).json(validatedEnvelope);
    }

    forgotPassword = async (req: Request<{}, {}, ForgotPasswordBody>, res: Response) => {
        await this.authService.forgotPassword(req.body);

        return res.sendStatus(204);
    }

    resetPassword = async (req: Request<{}, {}, ResetPasswordBody>, res: Response) => {
        await this.authService.resetPassword(req.body);

        return res.sendStatus(204);
    }

    changePassword = async (req: Request<{}, {}, ChangePasswordBody>, res: Response) => {
        await this.authService.changePassword(req.user!.id, req.body);

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        })

        return res.sendStatus(204);
    }

    me = async (req: Request, res: Response) => {
        const meResponse: SafeUserResponse = await this.authService.me(req.user!.id);

        const envelope = ok(meResponse);
        const validatedEnvelope = validateResponse(okEnvelopeSchema(safeUserSchema))(envelope);

        return res.status(200).json(validatedEnvelope);
    }
}