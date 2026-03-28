import type { Prisma } from '../../../prisma/generated/client.js';
import type { DbClient, DbOrTxClient } from '../../db/prisma.js';

export class ColumnRepo {
  constructor(readonly prisma: DbClient) {}

  async create(data: Prisma.ColumnCreateInput, db: DbOrTxClient = this.prisma) {
    return await db.column.create({ data });
  }

  async listByProject(
    workspaceId: string,
    projectId: string,
    actorId: string,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.column.findMany({
      where: {
        project: {
          id: projectId,
          workspace: {
            id: workspaceId,
            members: {
              some: {
                userId: actorId,
              },
            },
          },
        },
      },
    });
  }

  async get(
    workspaceId: string,
    projectId: string,
    columnId: string,
    actorId: string,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.column.findFirst({
      where: {
        id: columnId,
        project: {
          id: projectId,
          workspace: {
            id: workspaceId,
            members: {
              some: {
                userId: actorId,
              },
            },
          },
        },
      },
    });
  }

  async update(
    data: Prisma.ColumnUpdateInput,
    workspaceId: string,
    projectId: string,
    columnId: string,
    actorId: string,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.column.update({
      where: {
        id: columnId,
        project: {
          id: projectId,
          workspace: {
            id: workspaceId,
            members: {
              some: {
                userId: actorId,
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
    workspaceId: string,
    projectId: string,
    columnId: string,
    actorId: string,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.column.delete({
      where: {
        id: columnId,
        project: {
          id: projectId,
          workspace: {
            id: workspaceId,
            members: {
              some: {
                userId: actorId,
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
