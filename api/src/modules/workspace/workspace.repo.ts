import { Prisma } from '../../../prisma/generated/client.js';
import { type DbClient, type DbOrTxClient } from '../../db/prisma.js';

export class WorkspaceRepo {
  constructor(readonly prisma: DbClient) { }

  async create(
    workspaceData: Prisma.WorkspaceCreateInput,
    db: DbOrTxClient = this.prisma
  ) {
    return db.workspace.create({
      data: workspaceData,
    });
  }

  async createMembership(
    workspaceMemberData: Prisma.WorkspaceMemberCreateInput,
    db: DbOrTxClient = this.prisma,
  ) {
    return db.workspaceMember.create({
      data: workspaceMemberData,
    });
  }

  async findMembership(
    workspaceId: string,
    userId: string,
    db: DbOrTxClient = this.prisma
  ) {
    return db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findMembers(
    workspaceId: string,
    search: string | undefined,
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma
  ) {
    return db.workspaceMember.findMany({
      where: {
        workspaceId,
        ...(search
          ? {
            user: {
              name: {
                contains: search,
                mode: 'insensitive',
              }
            }
          }
          : {})
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      skip,
      take,
      orderBy: {
        joinedAt: 'desc',
      }
    });
  }

  async findInviteCandidates(
    workspaceId: string,
    search: string | undefined,
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma,
  ) {
    const pendingInvites = await db.invite.findMany({
      where: {
        workspaceId,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
      select: {
        email: true,
      },
    });

    const pendingInviteEmails = pendingInvites.map((invite) => invite.email);

    return db.user.findMany({
      where: {
        memberships: {
          none: {
            workspaceId,
          },
        },
        ...(pendingInviteEmails.length > 0
          ? { email: { notIn: pendingInviteEmails } }
          : {}),
        ...(search
          ? {
            email: {
              contains: search,
              mode: 'insensitive',
            }
          }
          : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      skip,
      take,
      orderBy: [
        { name: 'asc' },
        { email: 'asc' },
      ],
    });
  }

  async countInviteCandidates(
    workspaceId: string,
    search: string | undefined,
    db: DbOrTxClient = this.prisma
  ) {
    const pendingInvites = await db.invite.findMany({
      where: {
        workspaceId,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
        ...(search
          ? {
            email: {
              contains: search,
              mode: 'insensitive',
            }
          } : {})
      },
      select: {
        email: true,
      },
    });

    const pendingInviteEmails = pendingInvites.map((invite) => invite.email);

    return db.user.count({
      where: {
        memberships: {
          none: {
            workspaceId,
          },
        },
        ...(pendingInviteEmails.length > 0
          ? { email: { notIn: pendingInviteEmails } }
          : {}),
        ...(search ? {
          email: {
            contains: search,
            mode: 'insensitive',
          }
        } : {})
      },
    });
  }

  async findById(
    workspaceId: string,
    db: DbOrTxClient = this.prisma
  ) {
    return db.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findByUserId(
    userId: string,
    search: string | undefined,
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma) {
    return db.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
        ...(search
          ? {
            name: {
              contains: search,
              mode: 'insensitive',
            }
          }
          : {}),
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
        members: {
          where: { userId },
          select: {
            role: true,
            joinedAt: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findAllByUserId(
    userId: string,
    db: DbOrTxClient = this.prisma) {
    return db.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async update(
    workspaceId: string,
    data: Prisma.WorkspaceUpdateInput,
    db: DbOrTxClient = this.prisma,
  ) {
    return db.workspace.update({
      where: {
        id: workspaceId,
      },
      data,
    });
  }

  async delete(
    workspaceId: string,
    db: DbOrTxClient = this.prisma
  ) {
    return db.workspace.delete({
      where: { id: workspaceId },
    });
  }

  async inviteMembership(
    inviteData: Prisma.InviteCreateInput,
    db: DbOrTxClient = this.prisma,
  ) {
    return db.invite.create({
      data: inviteData,
    });
  }

  async findInviteByEmail(
    workspaceId: string,
    email: string,
    db: DbOrTxClient = this.prisma,
  ) {
    return db.invite.findFirst({
      where: {
        workspaceId,
        email,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
    });
  }

  async findInviteByJti(
    jti: string,
    db: DbOrTxClient = this.prisma
  ) {
    return db.invite.findFirst({
      where: {
        jti,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
    });
  }

  async markInviteUsed(
    jti: string,
    db: DbOrTxClient = this.prisma
  ) {
    return db.invite.updateMany({
      where: {
        jti,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  async deleteMembership(
    workspaceId: string,
    userId: string,
    db: DbOrTxClient = this.prisma,
  ) {
    return db.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
  }

  async countWorkspaceMembers(
    workspaceId: string,
    search: string | undefined,
    db: DbOrTxClient = this.prisma
  ) {
    return db.workspaceMember.count({
      where: {
        workspaceId,
        ...(search ? {
          user: {
            name: {
              contains: search,
              mode: 'insensitive',
            }
          }
        } : {})
      },
    });
  }

  async countWorkspacesByUserId(
    userId: string,
    search: string | undefined,
    db: DbOrTxClient = this.prisma
  ) {
    return db.workspace.count({
      where: {
        members: {
          some: { userId },
        },
        ...(search
          ? {
            name: {
              contains: search,
              mode: 'insensitive',
            }
          }
          : {}),
      },
    });
  }
}
