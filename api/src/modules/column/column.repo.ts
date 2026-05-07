import type { Column, ColumnType, Prisma } from '../../../prisma/generated/client.js';
import type { DataRangeQueryType } from '../../common/schemas/common.schemas.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import type { DbClient, DbOrTxClient } from '../../db/prisma.js';

export class ColumnRepo {
  constructor(readonly prisma: DbClient) { }

  async create(data: Prisma.ColumnCreateInput, db: DbOrTxClient = this.prisma): Promise<Column> {
    return await db.column.create({ data });
  }

  async listByProject(
    ctx: ResourceContext,
    search: string | undefined,
    dateRange: DataRangeQueryType,
    type: ColumnType | undefined,
    { skip, take }: { skip: number; take: number },
    db: DbOrTxClient = this.prisma,
  ): Promise<Column[]> {
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
        ...(search ? {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        } : {}),
        ...(type ? { type } : {}),
        ...(dateRange?.startDate || dateRange?.endDate ? {
          createdAt: {
            ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
            ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
          }
        } : {})
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
  ): Promise<Column[]> {
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
    search: string | undefined,
    dateRange: DataRangeQueryType,
    type: ColumnType | undefined,
    db: DbOrTxClient = this.prisma,
  ): Promise<number> {
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
        ...(search ? {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        } : {}),
        ...(type ? { type } : {}),
        ...(dateRange?.startDate || dateRange?.endDate ? {
          createdAt: {
            ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
            ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
          }
        } : {}) 
      },
    });
  }

  async get(
    ctx: ResourceContext, 
    db: DbOrTxClient = this.prisma
  ): Promise<Column | null> {
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
  ): Promise<Column> {
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
  ): Promise<Column> {
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
