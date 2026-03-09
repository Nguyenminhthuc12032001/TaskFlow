import {
    type LoginBody,
    type ForgotPasswordBody,
    type ResetPasswordBody,
    type ChangePasswordBody,
    type SafeUserResponse,
    type RegisterBody,
} from "./auth.schemas.js";

import { hashValue, verifyHash } from "../../common/utils/crypto.js";
import { AppError } from "../../common/errors/AppError.js";
import { AccessTokenPayload, RefreshTokenPayload, signAccessToken, signRefreshToken, signResetToken, verifyRefreshToken, verifyResetToken, type ResetTokenPayload } from "../../common/utils/jwt.js";
import { env } from "../../config/env.js";
import { randomUUID } from "crypto";
import { log } from "../../common/logger/logger.js";
import ms from "ms";
import type { IEmailService } from "../mail/mail.interface.js";
import type { AuthRepo } from "./auth.repo.js";
import type { DbClient } from "../../db/prisma.js";

export class AuthService {
    constructor(
        private emailService: IEmailService,
        private authRepo: AuthRepo,
        private prisma: DbClient
    ) { }

    register = async (data: RegisterBody) => {
        const existing = await this.authRepo.findUserByEmail(data.email);
        if (existing) {
            log.info(
                {
                    emailDomain: data.email?.split("@")[1] ?? "unknown"
                },
                "Register failed: email already exists"
            )
            throw new AppError("Email already exists", 409);
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const user = await this.authRepo.createUser({
                email: data.email,
                name: data.name,
                passwordHash: await hashValue(data.password),
            }, tx);

            const accessTokenPayload: AccessTokenPayload = {
                id: user.id,
                jti: randomUUID(),
                email: user.email,
                name: user.name
            }
            const accessToken = signAccessToken(accessTokenPayload);

            const refreshTokenPayload: RefreshTokenPayload = {
                id: user.id,
                jti: randomUUID(),
            }
            const refreshToken = signRefreshToken(refreshTokenPayload);
            await this.authRepo.saveRefreshToken(user.id, refreshTokenPayload.jti, await hashValue(refreshToken), new Date(Date.now() + ms(env.TTL_REFRESH_TOKEN as ms.StringValue)), tx);

            const safeUser: SafeUserResponse = {
                id: user.id,
                name: user.name,
                email: user.email,
            }

            return { safeUser, accessToken, refreshToken };
        });

        return result;
    }

    login = async (data: LoginBody) => {
        const match = await this.authRepo.findUserByEmail(data.email);
        if (!match) {
            log.info(
                {
                    emailDomain: data.email.split("@")[1]
                },
                "Login failed: email not found"
            )
            throw new AppError("Invalid email or password", 401);
        }

        if (!(await verifyHash(data.password, match.passwordHash))) {
            log.info(
                {
                    userId: match.id,
                },
                "Login failed: invalid password"
            )
            throw new AppError("Invalid email or password", 401);
        }

        const accessTokenPayload: AccessTokenPayload = {
            id: match.id,
            jti: randomUUID(),
            email: match.email,
            name: match.name
        }
        const accessToken = signAccessToken(accessTokenPayload);

        const refreshTokenPayload: RefreshTokenPayload = {
            id: match.id,
            jti: randomUUID(),
        }
        const refreshToken = signRefreshToken(refreshTokenPayload);

        await this.authRepo.saveRefreshToken(match.id, refreshTokenPayload.jti, await hashValue(refreshToken), new Date(Date.now() + ms(env.TTL_REFRESH_TOKEN as ms.StringValue)));

        const safeUser: SafeUserResponse = {
            id: match.id,
            name: match.name,
            email: match.email
        }

        return { safeUser, accessToken, refreshToken };
    }

    logout = async (refreshToken: string) => {
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new AppError("Invalid or expired refresh token", 401);
        }

        const token = await this.authRepo.findRefreshToken(payload.jti);
        if (!token) {
            throw new AppError("Refresh token not found or expired", 401);
        }

        if (!(await verifyHash(refreshToken, token.tokenHash))) {
            throw new AppError("Invalid token", 401);
        }

        const result = await this.authRepo.revokeRefreshToken(payload.jti)
        if (result.count === 0) throw new AppError("Refresh token not found or expired", 401);
    }

    refresh = async (refreshToken: string) => {
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch (error) {
            log.warn("Refresh token failed: invalid or expired token")
            throw new AppError("Invalid or expired refresh token", 401);
        }

        const token = await this.authRepo.findRefreshToken(payload.jti);

        if (!token) {
            log.warn(
                {
                    jti: payload.jti,
                },
                "Refresh token failed: token not found"
            )
            throw new AppError("Refresh token not found or expired", 401);
        }

        if (!(await verifyHash(refreshToken, token.tokenHash))) {
            throw new AppError("Invalid token", 401)
        }

        const user = await this.authRepo.findUserById(payload.id);
        if (!user) {
            throw new AppError("User not found, cannot refresh token", 401);
        }

        const newRefreshToken = await this.prisma.$transaction(async (tx) => {
            const revoke = await this.authRepo.revokeRefreshToken(payload.jti, tx);
            if (revoke.count === 0) {
                throw new AppError("Refresh token not found or expired", 401);
            }

            const refreshTokenPayload: RefreshTokenPayload = {
                id: user.id,
                jti: randomUUID()
            }
            const refreshToken = signRefreshToken(refreshTokenPayload);
            await this.authRepo.saveRefreshToken(user.id, refreshTokenPayload.jti, await hashValue(refreshToken), new Date(Date.now() + ms(env.TTL_REFRESH_TOKEN as ms.StringValue)), tx);

            return refreshToken;
        });

        const accessTokenPayload: AccessTokenPayload = {
            id: user.id,
            jti: randomUUID(),
            email: user.email,
            name: user.name
        }
        const accessToken = signAccessToken(accessTokenPayload);

        return { accessToken, refreshToken: newRefreshToken };
    }

    forgotPassword = async (data: ForgotPasswordBody) => {
        const user = await this.authRepo.findUserByEmail(data.email);
        if (!user) {
            return;
        }

        const resetTokenPayload: ResetTokenPayload = {
            id: user.id,
            jti: randomUUID(),
            email: user.email,
        }

        const resetToken = signResetToken(resetTokenPayload);
        await this.authRepo.saveResetToken(user.id, resetTokenPayload.jti, await hashValue(resetToken), new Date(Date.now() + ms(env.TTL_RESET_TOKEN as ms.StringValue)));

        const resetLink = `${env.FRONTEND_URL}/reset-password#token=${encodeURIComponent(resetToken)}`;
        await this.emailService.sendPasswordResetEmail(user.email, resetLink);
        log.info(
            { userId: user.id },
            "Password reset email sent"
        )
    }

    resetPassword = async (data: ResetPasswordBody) => {
        let payLoad;
        try {
            payLoad = verifyResetToken(data.resetToken);
        } catch (error) {
            log.warn("Reset password failed: invalid or expired token")
            throw new AppError("Invalid or expired reset token", 401);
        }

        const token = await this.authRepo.findResetToken(payLoad.jti);
        if (!token) {
            throw new AppError("Invalid or expired reset token", 401);
        }

        if (!(await verifyHash(data.resetToken, token.tokenHash))) {
            throw new AppError("Invalid or expired reset token", 401);
        }

        await this.prisma.$transaction(async (tx) => {
            const result = await this.authRepo.markResetToken(payLoad.jti, tx);
            if (result.count === 0) {
                throw new AppError("Invalid or expired reset token", 401);
            }

            await this.authRepo.revokeAllRefreshTokenByUser(payLoad.id, tx);

            await this.authRepo.updatePassword(payLoad.id, await hashValue(data.newPassword), tx);

            log.info(
                { userId: payLoad.id },
                "Password reset successful, all refresh tokens revoked"
            )
        });
    }

    changePassword = async (userId: string, data: ChangePasswordBody) => {
        const user = await this.authRepo.findUserById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (data.newPassword === data.currentPassword) {
            throw new AppError("New password must be different", 400);
        }

        if (!(await verifyHash(data.currentPassword, user.passwordHash))) {
            log.warn(
                { userId },
                "Change password failed: invalid current password"
            )
            throw new AppError("Invalid current password", 401);
        }

        const result = await this.prisma.$transaction(async (tx) => {

            await this.authRepo.revokeAllRefreshTokenByUser(userId, tx)

            const user = await this.authRepo.updatePassword(userId, await hashValue(data.newPassword), tx);
            log.info(
                { userId },
                "Password change successfully"
            )

            return user;
        })

        return { id: user.id, name: user.name, updatedAt: user.updatedAt };
    }

    me = async (userId: string) => {
        const user = await this.authRepo.findUserById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const safeUser: SafeUserResponse = {
            id: user.id,
            email: user.email,
            name: user.name
        }

        return safeUser;
    }
}