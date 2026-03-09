import { prisma, type DbOrTxClient } from "../../db/prisma.js";

export class AuthRepo {

    findUserById = async (
        userId: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.user.findUnique({
            where: { id: userId }
        });
    }

    findUserByEmail = async (
        email: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.user.findUnique({
            where: { email }
        });
    }

    createUser = async (
        data: { email: string; name: string; passwordHash: string },
        db: DbOrTxClient = prisma
    ) => {
        return db.user.create({ data });
    }

    updatePassword = async (
        userId: string, passwordHash: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.user.update({
            where: { id: userId },
            data: { passwordHash }
        })
    }

    saveRefreshToken = async (
        userId: string,
        jti: string,
        tokenHash: string,
        expiresAt: Date,
        db: DbOrTxClient = prisma
    ) => {
        return db.refreshToken.create({
            data: {
                userId,
                jti,
                tokenHash,
                expiresAt,
            }
        })
    }

    findRefreshToken = async (
        jti: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.refreshToken.findUnique({
            where: {
                jti,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            }
        })
    }

    revokeAllRefreshTokenByUser = async (
        userId: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() }
        })
    }

    revokeRefreshToken = async (
        jti: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.refreshToken.updateMany({
            where: {
                jti,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            data: { revokedAt: new Date() }
        })
    }

    saveResetToken = async (
        userId: string,
        jti: string,
        tokenHash: string,
        expiresAt: Date,
        db: DbOrTxClient = prisma
    ) => {
        return db.passwordResetToken.create({
            data: {
                userId,
                jti,
                tokenHash,
                expiresAt,
            }
        })
    }

    findResetToken = async (
        jti: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.passwordResetToken.findFirst({
            where: {
                jti,
                usedAt: null,
                expiresAt: { gt: new Date() }
            }
        })
    }

    markResetToken = async (
        jti: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.passwordResetToken.updateMany({
            where: {
                jti,
                usedAt: null,
                expiresAt: { gt: new Date() }
            },
            data: { usedAt: new Date() }
        })
    }
}
