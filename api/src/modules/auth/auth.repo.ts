import { prisma } from "../../db/prisma.js";

export const authRepo = {
    async findUserById(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId }
        });
    },

    async findUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email }
        });
    },

    async createUser(data: { email: string; name: string; passwordHash: string }, prisma_transaction: any = prisma) {
        return prisma_transaction.user.create({ data })
    },

    async updatePassword(userId: string, passwordHash: string, prisma_transaction: any = prisma) {
        return prisma_transaction.user.update({
            where: { id: userId },
            data: { passwordHash }
        })
    },

    async saveRefreshToken(userId: string, jti: string, tokenHash: string, expiresAt: Date, prisma_transaction: any = prisma) {
        return prisma_transaction.refreshToken.create({
            data: {
                userId,
                jti,
                tokenHash,
                expiresAt,
            }
        })
    },

    async findRefreshToken(jti: string) {
        return prisma.refreshToken.findUnique({
            where: {
                jti,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            }
        })
    },

    async revokeAllRefreshTokenByUser(userId: string, prisma_transaction: any = prisma) {
        return prisma_transaction.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() }
        })
    },

    async revokeRefreshToken(jti: string, prisma_transaction: any = prisma) {
        return prisma_transaction.refreshToken.updateMany({
            where: {
                jti,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            data: { revokedAt: new Date() }
        })
    },

    async saveResetToken(userId: string, jti: string, tokenHash: string, expiresAt: Date) {
        return prisma.passwordResetToken.create({
            data: {
                userId,
                jti,
                tokenHash,
                expiresAt,
            }
        })
    },

    async findResetToken(jti: string) {
        return prisma.passwordResetToken.findUnique({
            where: {
                jti,
                usedAt: null,
                expiresAt: { gt: new Date() }
            }
        })
    },

    async markResetToken(jti: string, prisma_transaction: any = prisma) {
        return prisma_transaction.passwordResetToken.updateMany({
            where: {
                jti,
                usedAt: null,
                expiresAt: { gt: new Date() }
            },
            data: { usedAt: new Date() }
        })
    }
}