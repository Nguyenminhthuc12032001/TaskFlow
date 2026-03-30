import type { Prisma } from '../../../prisma/generated/client.js';
import { type DbClient, type DbOrTxClient } from '../../db/prisma.js';

export class ProjectRepo {
  constructor(private readonly prisma: DbClient) { }

  async create(data: Prisma.ProjectCreateInput, db: DbOrTxClient = this.prisma) {
    return await db.project.create({ data });
  }

  async get(
    id: string,
    workspaceId: string,
    actorId: string,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.project.findFirst({
      where: {
        id,
        workspaceId,
        workspace: {
          members: {
            some: {
              userId: actorId,
            },
          },
        },
      },
    });
  }

  async listByWorkspace(
    workspaceId: string,
    actorId: string,
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.project.findMany({
      where: {
        workspaceId,
        workspace: {
          members: {
            some: {
              userId: actorId,
            },
          },
        },
      },
      skip,
      take,
    });
  }

  async allProjectsByWorkspace(
    workspaceId: string,
    actorId: string,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.project.findMany({
      where: {
        workspaceId,
        workspace: {
          members: {
            some: {
              userId: actorId,
            },
          },
        },
      },
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
    });
  }

  async update(
    data: Prisma.ProjectUpdateInput,
    workspaceId: string,
    projectId: string,
    actorId: string,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.project.update({
      where: {
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
      data,
    });
  }

  async remove(id: string, actorId: string, db: DbOrTxClient = this.prisma) {
    return await db.project.delete({
      where: {
        id,
        workspace: {
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
    });
  }

  async countProjectsByWorkspace(workspaceId: string, actorId: string, db: DbOrTxClient = this.prisma) {
    return await db.project.count({
      where: {
        workspaceId,
        workspace: {
          members: {
            some: {
              userId: actorId,
            },
          },
        },
      },
    });
  }
}
