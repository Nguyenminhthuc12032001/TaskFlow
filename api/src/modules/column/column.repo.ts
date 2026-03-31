import type { Prisma } from '../../../prisma/generated/client.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import type { DbClient, DbOrTxClient } from '../../db/prisma.js';

export class ColumnRepo {
  constructor(readonly prisma: DbClient) { }

  async create(data: Prisma.ColumnCreateInput, db: DbOrTxClient = this.prisma) {
    return await db.column.create({ data });
  }

  async listByProject(
    ctx: ResourceContext,
    { skip, take }: { skip: number; take: number },
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.column.findMany({
      where: {
        project: {
          id: ctx.projectId,
          workspace: {
            id: ctx.workspaceId,
            members: {
              some: {
                userId: ctx.ActorId,
              },
            },
          },
        },
      },
      skip,
      take,
      orderBy: {
        position: 'asc'
      }
    });
  }

  async allColumnsByProject(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.column.findMany({
      where: {
        project: {
          id: ctx.projectId,
          workspace: {
            id: ctx.workspaceId,
            members: {
              some: {
                userId: ctx.ActorId,
              },
            },
          },
        },
      },
      orderBy: {
        position: 'asc'
      }
    });
  }

  async countColumnsByProject(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.column.count({
      where: {
        project: {
          id: ctx.projectId,
          workspace: {
            id: ctx.workspaceId,
            members: {
              some: {
                userId: ctx.ActorId,
              },
            },
          },
        },
      },
    });
  }

  async get(ctx: ResourceContext, db: DbOrTxClient = this.prisma) {
    return await db.column.findFirst({
      where: {
        id: ctx.columnId,
        project: {
          id: ctx.projectId,
          workspace: {
            id: ctx.workspaceId,
            members: {
              some: {
                userId: ctx.ActorId,
              },
            },
          },
        },
      },
    });
  }

  async update(
    data: Prisma.ColumnUpdateInput,
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.column.update({
      where: {
        id: ctx.columnId,
        project: {
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
      },
      data,
    });
  }

  async remove(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.column.delete({
      where: {
        id: ctx.columnId,
        project: {
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
      },
    });
  }
}
