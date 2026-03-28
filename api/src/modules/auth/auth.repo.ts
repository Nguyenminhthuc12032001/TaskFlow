import { prisma, type DbClient, type DbOrTxClient } from '../../db/prisma.js';

export class AuthRepo {
  constructor(readonly prisma: DbClient) { }

  async findUserById(userId: string, db: DbOrTxClient = this.prisma) {
    return db.user.findUnique({
      where: { id: userId },
    });
  };

  async findUserByEmail(email: string, db: DbOrTxClient = this.prisma) {
    return db.user.findUnique({
      where: { email },
    });
  };

  async createUser(
    data: { email: string; name: string; passwordHash: string },
    db: DbOrTxClient = this.prisma,
  ) {
    return db.user.create({ data });
  };

  async updatePassword(userId: string, passwordHash: string, db: DbOrTxClient = this.prisma) {
    return db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  };

  async saveRefreshToken(
    userId: string,
    jti: string,
    tokenHash: string,
    expiresAt: Date,
    db: DbOrTxClient = this.prisma,
  ) {
    return db.refreshToken.create({
      data: {
        userId,
        jti,
        tokenHash,
        expiresAt,
      },
    });
  };

  async findRefreshToken(jti: string, db: DbOrTxClient = this.prisma) {
    return db.refreshToken.findUnique({
      where: {
        jti,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  };

  async revokeAllRefreshTokenByUser(userId: string, db: DbOrTxClient = this.prisma) {
    return db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  };

  async revokeRefreshToken(jti: string, db: DbOrTxClient = this.prisma) {
    return db.refreshToken.updateMany({
      where: {
        jti,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
  };

  async saveResetToken(
    userId: string,
    jti: string,
    tokenHash: string,
    expiresAt: Date,
    db: DbOrTxClient = this.prisma,
  ) {
    return db.passwordResetToken.create({
      data: {
        userId,
        jti,
        tokenHash,
        expiresAt,
      },
    });
  };

  async findResetToken(jti: string, db: DbOrTxClient = this.prisma) {
    return db.passwordResetToken.findFirst({
      where: {
        jti,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  };

  async markResetToken(jti: string, db: DbOrTxClient = this.prisma) {
    return db.passwordResetToken.updateMany({
      where: {
        jti,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
  };
}
