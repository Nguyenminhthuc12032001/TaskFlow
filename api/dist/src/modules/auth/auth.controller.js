import { authService } from "./auth.service.js";
import { loginResponseSchema, refreshResponseSchema, registerResponseSchema, safeUserSchema } from "./auth.schemas.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { validateResponse } from "../../common/utils/response/validate.js";
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from "../../common/utils/response/format.js";
export const authController = {
    register: async (req, res) => {
        const result = await authService.register(req.body);
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        });
        const registerResponse = {
            user: result.safeUser,
            accessToken: result.accessToken
        };
        const envelope = created(registerResponse);
        const validatedEnvelope = validateResponse(createdEnvelopeSchema(registerResponseSchema))(envelope);
        return res.status(201).json(validatedEnvelope);
    },
    login: async (req, res) => {
        const result = await authService.login(req.body);
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        });
        const loginResponse = {
            user: result.safeUser,
            accessToken: result.accessToken
        };
        const envelope = ok(loginResponse);
        const validatedEnvelope = validateResponse(okEnvelopeSchema(loginResponseSchema))(envelope);
        return res.status(200).json(validatedEnvelope);
    },
    logout: async (req, res) => {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken)
            return res.sendStatus(204);
        await authService.logout(refreshToken);
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        });
        return res.sendStatus(204);
    },
    refresh: async (req, res) => {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new AppError("Refresh token missing", 401);
        }
        const result = await authService.refresh(refreshToken);
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        });
        const refreshResponse = {
            accessToken: result.accessToken
        };
        const envelope = ok(refreshResponse);
        const validatedEnvelope = validateResponse(okEnvelopeSchema(refreshResponseSchema))(envelope);
        return res.status(200).json(validatedEnvelope);
    },
    forgotPassword: async (req, res) => {
        await authService.forgotPassword(req.body);
        return res.sendStatus(204);
    },
    resetPassword: async (req, res) => {
        await authService.resetPassword(req.body);
        return res.sendStatus(204);
    },
    changePassword: async (req, res) => {
        await authService.changePassword(req.user.id, req.body);
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/auth"
        });
        return res.sendStatus(204);
    },
    me: async (req, res) => {
        const meResponse = await authService.me(req.user.id);
        const envelope = ok(meResponse);
        const validatedEnvelope = validateResponse(okEnvelopeSchema(safeUserSchema))(envelope);
        return res.status(200).json(validatedEnvelope);
    }
};
