import type { Prisma, Project } from '../../../prisma/generated/client.js';
import type { DataRangeQueryType } from '../../common/schemas/common.schemas.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import { type DbClient, type DbOrTxClient } from '../../db/prisma.js';

export class ProjectRepo {
  constructor(private readonly prisma: DbClient) {}

  async create(data: Prisma.ProjectCreateInput, db: DbOrTxClient = this.prisma): Promise<Project> {
    return await db.project.create({ data });
  }

  async get(ctx: ResourceContext, db: DbOrTxClient = this.prisma): Promise<Project | null> {
    return await db.project.findFirst({
      where: {
        id: ctx.projectId,
        workspaceId: ctx.workspaceId,
        workspace: {
          members: {
            some: {
              userId: ctx.ActorId,
            },
          },
        },
      },
    });
  }

  async listByWorkspace(
    ctx: ResourceContext,
    search: string | undefined,
    dateRange: DataRangeQueryType,
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma,
  ): Promise<Project[]> {
    return await db.project.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        workspace: {
          members: {
            some: {
              userId: ctx.ActorId,
            },
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
                  description: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
        ...(dateRange?.startDate || dateRange?.endDate
          ? {
              createdAt: {
                ...(dateRange?.startDate ? { gte: dateRange.startDate } : {}),
                ...(dateRange?.endDate ? { lte: dateRange.endDate } : {}),
              },
            }
          : {}),
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async allProjectsByWorkspace(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ): Promise<Project[]> {
    return await db.project.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        workspace: {
          members: {
            some: {
              userId: ctx.ActorId,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async listByUser(actorId: string, db: DbOrTxClient = this.prisma): Promise<Project[]> {
    return await db.project.findMany({
      where: {
        workspace: {
          members: {
            some: {
              userId: actorId,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    data: Prisma.ProjectUpdateInput,
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ): Promise<Project> {
    return await db.project.update({
      where: {
        id: ctx.projectId,
        workspace: {
          id: ctx.workspaceId,
          members: {
            some: {
              userId: ctx.ActorId,
              role: {
                in: ['admin', 'owner'],
              },
            },
          },
        },
      },
      data,
    });
  }

  async remove(ctx: ResourceContext, db: DbOrTxClient = this.prisma): Promise<Project> {
    return await db.project.delete({
      where: {
        id: ctx.projectId,
        workspace: {
          id: ctx.workspaceId,
          members: {
            some: {
              userId: ctx.ActorId,
              role: {
                in: ['admin', 'owner'],
              },
            },
          },
        },
      },
    });
  }

  async countProjectsByWorkspace(
    ctx: ResourceContext,
    search: string | undefined,
    dateRange: DataRangeQueryType,
    db: DbOrTxClient = this.prisma,
  ): Promise<number> {
    return await db.project.count({
      where: {
        workspaceId: ctx.workspaceId,
        workspace: {
          members: {
            some: {
              userId: ctx.ActorId,
            },
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
                  description: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
        ...(dateRange?.startDate || dateRange?.endDate
          ? {
              createdAt: {
                ...(dateRange?.startDate ? { gte: dateRange.startDate } : {}),
                ...(dateRange?.endDate ? { lte: dateRange.endDate } : {}),
              },
            }
          : {}),
      },
    });
  }
}
