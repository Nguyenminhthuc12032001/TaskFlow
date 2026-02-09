import { prisma } from "../../db/prisma.js";
export const authRepo = {
    async findUserByid(userId) {
        return prisma.user.findUnique({
            where: { id: userId }
        });
    },
    async findUserByEmail(email) {
        return prisma.user.findUnique({
            where: { email }
        });
    },
    async createUser(data) {
        return prisma.user.create({ data });
    },
    async updatePassword(userId, passwordHash) {
        return prisma.user.update({
            where: { id: userId },
            data: { passwordHash }
        });
    },
    async saveRefreshToken(userId, tokenHash, expiresAt) {
        return prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            }
        });
    },
    async deleteRefreshToken(id) {
        return prisma.refreshToken.delete({
            where: { id }
        });
    },
    async findRefreshToken(id) {
        return prisma.refreshToken.findUnique({
            where: { id }
        });
    },
    async deleteAllRefreshTokenByUser(userId) {
        return prisma.refreshToken.deleteMany({
            where: { userId }
        });
    },
    async revokeRefreshTokenById(id) {
        return prisma.refreshToken.update({
            where: { id, revokedAt: null },
            data: { revokedAt: new Date() }
        });
    }
};
