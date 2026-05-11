import type { GetBatchResult } from '@prisma/client/runtime/client';
import type { PasswordResetToken, RefreshToken, User } from '../../../prisma/generated/client.js';
import { type DbClient, type DbOrTxClient } from '../../db/prisma.js';

export class AuthRepo {
  constructor(readonly prisma: DbClient) {}

  async findUserById(userId: string, db: DbOrTxClient = this.prisma): Promise<User | null> {
    return db.user.findUnique({
      where: { id: userId },
    });
  }

  async findUserByEmail(email: string, db: DbOrTxClient = this.prisma): Promise<User | null> {
    return db.user.findUnique({
      where: { email },
    });
  }

  async createUser(
    data: { email: string; name: string; passwordHash: string },
    db: DbOrTxClient = this.prisma,
  ): Promise<User> {
    return db.user.create({ data });
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
    db: DbOrTxClient = this.prisma,
  ): Promise<User> {
    return db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async saveRefreshToken(
    userId: string,
    jti: string,
    tokenHash: string,
    expiresAt: Date,
    db: DbOrTxClient = this.prisma,
  ): Promise<unknown> {
    return db.refreshToken.create({
      data: {
        userId,
        jti,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findRefreshToken(
    jti: string,
    db: DbOrTxClient = this.prisma,
  ): Promise<RefreshToken | null> {
    return db.refreshToken.findUnique({
      where: {
        jti,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revokeAllRefreshTokenByUser(
    userId: string,
    db: DbOrTxClient = this.prisma,
  ): Promise<GetBatchResult> {
    return db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeRefreshToken(jti: string, db: DbOrTxClient = this.prisma): Promise<GetBatchResult> {
    return db.refreshToken.updateMany({
      where: {
        jti,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
  }

  async saveResetToken(
    userId: string,
    jti: string,
    tokenHash: string,
    expiresAt: Date,
    db: DbOrTxClient = this.prisma,
  ): Promise<PasswordResetToken> {
    return db.passwordResetToken.create({
      data: {
        userId,
        jti,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findResetToken(
    jti: string,
    db: DbOrTxClient = this.prisma,
  ): Promise<PasswordResetToken | null> {
    return db.passwordResetToken.findFirst({
      where: {
        jti,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async markResetToken(jti: string, db: DbOrTxClient = this.prisma): Promise<GetBatchResult> {
    return db.passwordResetToken.updateMany({
      where: {
        jti,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
  }
}
