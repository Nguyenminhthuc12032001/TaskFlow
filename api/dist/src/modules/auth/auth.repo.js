export class AuthRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findUserById(userId, db = this.prisma) {
        return db.user.findUnique({
            where: { id: userId },
        });
    }
    ;
    async findUserByEmail(email, db = this.prisma) {
        return db.user.findUnique({
            where: { email },
        });
    }
    ;
    async createUser(data, db = this.prisma) {
        return db.user.create({ data });
    }
    ;
    async updatePassword(userId, passwordHash, db = this.prisma) {
        return db.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }
    ;
    async saveRefreshToken(userId, jti, tokenHash, expiresAt, db = this.prisma) {
        return db.refreshToken.create({
            data: {
                userId,
                jti,
                tokenHash,
                expiresAt,
            },
        });
    }
    ;
    async findRefreshToken(jti, db = this.prisma) {
        return db.refreshToken.findUnique({
            where: {
                jti,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
    }
    ;
    async revokeAllRefreshTokenByUser(userId, db = this.prisma) {
        return db.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    ;
    async revokeRefreshToken(jti, db = this.prisma) {
        return db.refreshToken.updateMany({
            where: {
                jti,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: { revokedAt: new Date() },
        });
    }
    ;
    async saveResetToken(userId, jti, tokenHash, expiresAt, db = this.prisma) {
        return db.passwordResetToken.create({
            data: {
                userId,
                jti,
                tokenHash,
                expiresAt,
            },
        });
    }
    ;
    async findResetToken(jti, db = this.prisma) {
        return db.passwordResetToken.findFirst({
            where: {
                jti,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
    }
    ;
    async markResetToken(jti, db = this.prisma) {
        return db.passwordResetToken.updateMany({
            where: {
                jti,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: { usedAt: new Date() },
        });
    }
    ;
}
