import type { Prisma, TaskPriority } from '../../../prisma/generated/client.js';
import type { DataRangeQueryType } from '../../common/schemas/common.schemas.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import type { DbClient, DbOrTxClient } from '../../db/prisma.js';

export class TaskRepo {
  constructor(readonly prisma: DbClient) { }

  async create(
    data: Prisma.TaskCreateInput,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.task.create({ data });
  }

  async isExistAssignee(
    userId: string,
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.taskAssignee.findFirst({
      where: {
        task: {
          id: ctx.TaskId,
          column: {
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
        },
        userId,
      },
    });
  }

  async assign(
    data: Prisma.TaskAssigneeCreateInput,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.taskAssignee.create({ data });
  }

  async get(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.task.findUnique({
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
      },
      where: {
        id: ctx.TaskId,
        column: {
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
      },
    });
  }

  async listByColumn(
    ctx: ResourceContext,
    search: string | undefined,
    dateRange: DataRangeQueryType,
    dueDateRange: DataRangeQueryType | undefined,
    priority: TaskPriority | undefined,
    { take, skip }: { take: number; skip: number },
    db: DbOrTxClient = this.prisma
  ) {
    return await db.task.findMany({
      include: {
        assignees: true,
      },
      where: {
        column: {
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
        ...(search ? {
          title: {
            contains: search,
            mode: 'insensitive',
          }
        } : {}),
        ...(dateRange?.startDate || dateRange?.endDate ? {
          createdAt: {
            ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
            ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
          }
        } : {}),
        ...(dueDateRange?.startDate || dueDateRange?.endDate ? {
          dueDate: {
            ...(dueDateRange.startDate ? { gte: dueDateRange.startDate } : {}),
            ...(dueDateRange.endDate ? { lte: dueDateRange.endDate } : {}),
          }
        } : {}),
        ...(priority ? { priority } : {})
      },
      orderBy: {
        position: 'asc'
      },
      skip,
      take,
    });
  }

  async allTasksByColumn(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.task.findMany({
      include: {
        assignees: true,
      },
      where: {
        column: {
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
      },
      orderBy: {
        position: 'asc'
      }
    });
  }

  async countTasksByColumn(
    ctx: ResourceContext,
    search: string | undefined,
    dateRange: DataRangeQueryType,
    dueDateRange: DataRangeQueryType | undefined,
    priority: TaskPriority | undefined,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.task.count({
      where: {
        column: {
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
        ...(search ? {
          title: {
            contains: search,
            mode: 'insensitive',
          }
        } : {}),
        ...(dateRange?.startDate || dateRange?.endDate ? {
          createdAt: {
            ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
            ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
          }
        } : {}),
        ...(dueDateRange?.startDate || dueDateRange?.endDate ? {
          dueDate: {
            ...(dueDateRange.startDate ? { gte: dueDateRange.startDate } : {}),
            ...(dueDateRange.endDate ? { lte: dueDateRange.endDate } : {}),
          }
        } : {}),
        ...(priority ? { priority } : {})
      },
    });
  }

  async update(
    data: Prisma.TaskUpdateInput,
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.task.update({
      data,
      where: {
        id: ctx.TaskId,
        column: {
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
      },
    });
  }

  async archivTask(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.task.update({
      where: {
        id: ctx.TaskId,
        column: {
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
      },
      data: {
        isArchiv: true,
      },
    });
  }

  async restoreTask(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.task.update({
      where: {
        id: ctx.TaskId,
        column: {
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
      },
      data: {
        isArchiv: false,
      },
    });
  }

  async remove(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.task.delete({
      where: {
        id: ctx.TaskId,
        column: {
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
      },
    });
  }
}
