import type { Prisma } from '../../../prisma/generated/client.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import { type DbClient, type DbOrTxClient } from '../../db/prisma.js';

export class ProjectRepo {
  constructor(private readonly prisma: DbClient) { }

  async create(
    data: Prisma.ProjectCreateInput,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.project.create({ data });
  }

  async get(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
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
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma,
  ) {
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
        ...(search ? {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        } : {})
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async allProjectsByWorkspace(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ) {
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
        createdAt: 'desc'
      }
    });
  }

  async listByUser(actorId: string, db: DbOrTxClient = this.prisma) {
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
        createdAt: 'desc'
      }
    });
  }

  async update(
    data: Prisma.ProjectUpdateInput,
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ) {
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

  async remove(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
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
    db: DbOrTxClient = this.prisma
  ) {
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
        ...(search ? {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        } : {})
      },
    });
  }
}
