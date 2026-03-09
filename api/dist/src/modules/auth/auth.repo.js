import { prisma } from "../../db/prisma.js";
export class AuthRepo {
    constructor() {
        this.findUserById = async (userId, db = prisma) => {
            return db.user.findUnique({
                where: { id: userId }
            });
        };
        this.findUserByEmail = async (email, db = prisma) => {
            return db.user.findUnique({
                where: { email }
            });
        };
        this.createUser = async (data, db = prisma) => {
            return db.user.create({ data });
        };
        this.updatePassword = async (userId, passwordHash, db = prisma) => {
            return db.user.update({
                where: { id: userId },
                data: { passwordHash }
            });
        };
        this.saveRefreshToken = async (userId, jti, tokenHash, expiresAt, db = prisma) => {
            return db.refreshToken.create({
                data: {
                    userId,
                    jti,
                    tokenHash,
                    expiresAt,
                }
            });
        };
        this.findRefreshToken = async (jti, db = prisma) => {
            return db.refreshToken.findUnique({
                where: {
                    jti,
                    revokedAt: null,
                    expiresAt: { gt: new Date() }
                }
            });
        };
        this.revokeAllRefreshTokenByUser = async (userId, db = prisma) => {
            return db.refreshToken.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() }
            });
        };
        this.revokeRefreshToken = async (jti, db = prisma) => {
            return db.refreshToken.updateMany({
                where: {
                    jti,
                    revokedAt: null,
                    expiresAt: { gt: new Date() }
                },
                data: { revokedAt: new Date() }
            });
        };
        this.saveResetToken = async (userId, jti, tokenHash, expiresAt, db = prisma) => {
            return db.passwordResetToken.create({
                data: {
                    userId,
                    jti,
                    tokenHash,
                    expiresAt,
                }
            });
        };
        this.findResetToken = async (jti, db = prisma) => {
            return db.passwordResetToken.findFirst({
                where: {
                    jti,
                    usedAt: null,
                    expiresAt: { gt: new Date() }
                }
            });
        };
        this.markResetToken = async (jti, db = prisma) => {
            return db.passwordResetToken.updateMany({
                where: {
                    jti,
                    usedAt: null,
                    expiresAt: { gt: new Date() }
                },
                data: { usedAt: new Date() }
            });
        };
    }
}
