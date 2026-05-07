import { Prisma, type WorkspaceRole } from '../../../prisma/generated/client.js';
import type { DataRangeQueryType } from '../../common/schemas/common.schemas.js';
import { type DbClient, type DbOrTxClient } from '../../db/prisma.js';

function buildDateRangeFilter(dateRange: DataRangeQueryType) {
  if (!dateRange?.startDate && !dateRange?.endDate) return undefined;

  return {
    ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
    ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
  };
}

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
    dateRange: DataRangeQueryType,
    role: WorkspaceRole | undefined,
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma
  ) {
    const joinedAtFilter = buildDateRangeFilter(dateRange);

    return db.workspaceMember.findMany({
      where: {
        workspaceId,
        ...(search
          ? {
            user: {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          }
          : {}),
        ...(joinedAtFilter ? { joinedAt: joinedAtFilter } : {}),
        ...(role ? { role } : {}),
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
    dateRange: DataRangeQueryType,
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma,
  ) {
    const createdAtFilter = buildDateRangeFilter(dateRange);

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
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
          : {}),
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
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
    dateRange: DataRangeQueryType,
    db: DbOrTxClient = this.prisma
  ) {
    const createdAtFilter = buildDateRangeFilter(dateRange);

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
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        } : {}),
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
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
    dateRange: DataRangeQueryType,
    actorRole: WorkspaceRole | undefined,
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma) {
    const createdAtFilter = buildDateRangeFilter(dateRange);

    return db.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
            ...(actorRole ? { role: actorRole } : {}),
          },
        },
        ...(search
          ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                creator: {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
          : {}),
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
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
    dateRange: DataRangeQueryType,
    role: WorkspaceRole | undefined,
    db: DbOrTxClient = this.prisma
  ) {
    const joinedAtFilter = buildDateRangeFilter(dateRange);

    return db.workspaceMember.count({
      where: {
        workspaceId,
        ...(search ? {
          user: {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        } : {}),
        ...(joinedAtFilter ? { joinedAt: joinedAtFilter } : {}),
        ...(role ? { role } : {}),
      },
    });
  }

  async countWorkspacesByUserId(
    userId: string,
    search: string | undefined,
    dateRange: DataRangeQueryType,
    actorRole: WorkspaceRole | undefined,
    db: DbOrTxClient = this.prisma
  ) {
    const createdAtFilter = buildDateRangeFilter(dateRange);

    return db.workspace.count({
      where: {
        members: {
          some: {
            userId,
            ...(actorRole ? { role: actorRole } : {}),
          },
        },
        ...(search
          ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                creator: {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
          : {}),
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
    });
  }
}
