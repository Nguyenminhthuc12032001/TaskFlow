import { prisma } from "../../db/prisma.js";
export const authRepo = {
    async findUserById(userId) {
        return prisma.user.findUnique({
            where: { id: userId }
        });
    },
    async findUserByEmail(email) {
        return prisma.user.findUnique({
            where: { email }
        });
    },
    async createUser(data, prisma_transaction = prisma) {
        return prisma_transaction.user.create({ data });
    },
    async updatePassword(userId, passwordHash, prisma_transaction = prisma) {
        return prisma_transaction.user.update({
            where: { id: userId },
            data: { passwordHash }
        });
    },
    async saveRefreshToken(userId, jti, tokenHash, expiresAt, prisma_transaction = prisma) {
        return prisma_transaction.refreshToken.create({
            data: {
                userId,
                jti,
                tokenHash,
                expiresAt,
            }
        });
    },
    async findRefreshToken(jti) {
        return prisma.refreshToken.findUnique({
            where: {
                jti,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            }
        });
    },
    async revokeAllRefreshTokenByUser(userId, prisma_transaction = prisma) {
        return prisma_transaction.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() }
        });
    },
    async revokeRefreshToken(jti, prisma_transaction = prisma) {
        return prisma_transaction.refreshToken.updateMany({
            where: {
                jti,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            data: { revokedAt: new Date() }
        });
    },
    async saveResetToken(userId, jti, tokenHash, expiresAt) {
        return prisma.passwordResetToken.create({
            data: {
                userId,
                jti,
                tokenHash,
                expiresAt,
            }
        });
    },
    async findResetToken(jti) {
        return prisma.passwordResetToken.findUnique({
            where: {
                jti,
                usedAt: null,
                expiresAt: { gt: new Date() }
            }
        });
    },
    async markResetToken(jti, prisma_transaction = prisma) {
        return prisma_transaction.passwordResetToken.updateMany({
            where: {
                jti,
                usedAt: null,
                expiresAt: { gt: new Date() }
            },
            data: { usedAt: new Date() }
        });
    }
};
