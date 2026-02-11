import { authRepo } from "./auth.repo.js";
import { hash, compare } from "../../common/utils/crypto.js";
import { AppError } from "../../common/errors/AppError.js";
import { signAccessToken, signRefreshToken, signResetToken, verifyRefreshToken, verifyResetToken } from "../../common/utils/jwt.js";
import { sendPasswordResetEmail } from "../mail/mail.service.js";
import { env } from "../../config/env.js";
import { randomUUID } from "crypto";
import { prisma } from "../../db/prisma.js";
export const authService = {
    async register(data) {
        const existing = await authRepo.findUserByEmail(data.email);
        if (existing) {
            throw new AppError("Email already exists", 409);
        }
        const result = await prisma.$transaction(async (tx) => {
            const user = await authRepo.createUser({
                email: data.email,
                name: data.name,
                passwordHash: await hash(data.password),
            }, tx);
            const accessTokenPayload = {
                id: user.id,
                jti: randomUUID(),
                email: user.email,
                name: user.name
            };
            const accessToken = signAccessToken(accessTokenPayload);
            const refreshTokenPayload = {
                id: user.id,
                jti: randomUUID(),
            };
            const refreshToken = signRefreshToken(refreshTokenPayload);
            await authRepo.saveRefreshToken(user.id, refreshTokenPayload.jti, await hash(refreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), tx);
            const safeUser = {
                id: user.id,
                name: user.name,
                email: user.email,
            };
            return { safeUser, accessToken, refreshToken };
        });
        return result;
    },
    async login(data) {
        const match = await authRepo.findUserByEmail(data.email);
        if (!match) {
            throw new AppError("Invalid email or password", 401);
        }
        if (!(await compare(data.password, match.passwordHash))) {
            throw new AppError("Invalid email or password", 401);
        }
        const accessTokenPayload = {
            id: match.id,
            jti: randomUUID(),
            email: match.email,
            name: match.name
        };
        const accessToken = signAccessToken(accessTokenPayload);
        const refreshTokenPayload = {
            id: match.id,
            jti: randomUUID(),
        };
        const refreshToken = signRefreshToken(refreshTokenPayload);
        await authRepo.saveRefreshToken(match.id, refreshTokenPayload.jti, await hash(refreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        const safeUser = {
            id: match.id,
            name: match.name,
            email: match.email
        };
        return { safeUser, accessToken, refreshToken };
    },
    async logout(refreshToken) {
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        }
        catch (error) {
            throw new AppError("Invalid or expired refresh token", 401);
        }
        const token = await authRepo.findRefreshToken(payload.jti);
        if (!token) {
            throw new AppError("Refresh token not found or expired", 401);
        }
        if (!(await compare(refreshToken, token.tokenHash))) {
            throw new AppError("Invalid token", 401);
        }
        const result = await authRepo.revokeRefreshToken(payload.jti);
        if (result.count === 0)
            throw new AppError("Refresh token not found or expired", 401);
    },
    async refresh(refreshToken) {
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        }
        catch (error) {
            throw new AppError("Invalid or expired refresh token", 401);
        }
        const token = await authRepo.findRefreshToken(payload.jti);
        if (!token) {
            throw new AppError("Refresh token not found or expired", 401);
        }
        if (!(await compare(refreshToken, token.tokenHash))) {
            throw new AppError("Invalid token", 401);
        }
        const user = await authRepo.findUserById(payload.id);
        if (!user) {
            throw new AppError("User not found, cannot refresh token", 401);
        }
        const newRefreshToken = await prisma.$transaction(async (tx) => {
            const revoke = await authRepo.revokeRefreshToken(payload.jti, tx);
            if (revoke.count === 0) {
                throw new AppError("Refresh token not found or expired", 401);
            }
            const refreshTokenPayload = {
                id: user.id,
                jti: randomUUID()
            };
            const refreshToken = signRefreshToken(refreshTokenPayload);
            await authRepo.saveRefreshToken(user.id, refreshTokenPayload.jti, await hash(refreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), tx);
            return refreshToken;
        });
        const accessTokenPayload = {
            id: user.id,
            jti: randomUUID(),
            email: user.email,
            name: user.name
        };
        const accessToken = signAccessToken(accessTokenPayload);
        return { accessToken, refreshToken: newRefreshToken };
    },
    async forgotPassword(data) {
        const user = await authRepo.findUserByEmail(data.email);
        if (!user) {
            return;
        }
        const resetTokenPayload = {
            id: user.id,
            jti: randomUUID(),
            email: user.email,
        };
        const resetToken = signResetToken(resetTokenPayload);
        await authRepo.saveResetToken(user.id, resetTokenPayload.jti, await hash(resetToken), new Date(Date.now() + 15 * 60 * 1000));
        const resetLink = `${env.FRONTEND_URL}/reset-password#token=${encodeURIComponent(resetToken)}`;
        await sendPasswordResetEmail(user.email, resetLink);
    },
    async resetPassword(data) {
        let payLoad;
        try {
            payLoad = verifyResetToken(data.resetToken);
        }
        catch (error) {
            throw new AppError("Invalid or expired reset token", 401);
        }
        const token = await authRepo.findResetToken(payLoad.jti);
        if (!token) {
            throw new AppError("Invalid or expired reset token", 401);
        }
        if (!(await compare(data.resetToken, token.tokenHash))) {
            throw new AppError("Invalid or expired reset token", 401);
        }
        await prisma.$transaction(async (tx) => {
            const result = await authRepo.markResetToken(payLoad.jti, tx);
            if (result.count === 0) {
                throw new AppError("Invalid or expired reset token", 401);
            }
            await authRepo.revokeAllRefreshTokenByUser(payLoad.id, tx);
            await authRepo.updatePassword(payLoad.id, await hash(data.newPassword), tx);
        });
    },
    async changePassword(userId, data) {
        const user = await authRepo.findUserById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }
        if (data.newPassword === data.currentPassword) {
            throw new AppError("New password must be different", 400);
        }
        if (!(await compare(data.currentPassword, user.passwordHash))) {
            throw new AppError("Invalid current password", 401);
        }
        await authRepo.updatePassword(userId, await hash(data.newPassword));
    },
    async me(userId) {
        const user = await authRepo.findUserById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }
        const safeUser = {
            id: user.id,
            email: user.email,
            name: user.name
        };
        return safeUser;
    },
};
