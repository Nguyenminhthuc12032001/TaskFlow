import type { Comment, Prisma, WorkspaceMember } from '../../../prisma/generated/client.js';
import type { DataRangeQueryType } from '../../common/schemas/common.schemas.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import type { DbClient, DbOrTxClient } from '../../db/prisma.js';

export class CommentRepo {
  constructor(readonly prisma: DbClient) { }

  async create(data: Prisma.CommentCreateInput, db: DbOrTxClient = this.prisma): Promise<Comment> {
    return await db.comment.create({ data });
  }

  async reply(data: Prisma.CommentCreateInput, db: DbOrTxClient = this.prisma): Promise<Comment> {
    return await db.comment.create({ data });
  }

  async get(ctx: ResourceContext, db: DbOrTxClient = this.prisma): Promise<Comment | null> {
    return await db.comment.findUnique({
      where: {
        id: ctx.CommentId,
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
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async listByTask(
    ctx: ResourceContext,
    search: string | undefined,
    dateRange: DataRangeQueryType,
    parentId: string | undefined,
    { skip, take }: { skip: number; take: number },
    db: DbOrTxClient = this.prisma
  ): Promise<Comment[]> {
    return await db.comment.findMany({
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
                  },
                },
              },
            },
          },
        },
        ...(search ? {
          content: {
            contains: search,
            mode: 'insensitive',
          }
        } : {}),
        ...(parentId ? {
          parentId
        } : {}),
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
        createdAt: 'desc'
      }
    });
  }

  async allCommentsByTask(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ): Promise<Comment[]> {
    return await db.comment.findMany({
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
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async countCommentsByTask(
    ctx: ResourceContext,
    search: string | undefined,
    dateRange: DataRangeQueryType,
    parentId: string | undefined,
    db: DbOrTxClient = this.prisma
  ): Promise<number> {
    return await db.comment.count({
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
                  },
                },
              },
            },
          },
        },
        ...(search ? {
          content: {
            contains: search,
            mode: 'insensitive',
          }
        } : {}),
        ...(parentId ? { parentId } : {}),
        ...(dateRange?.startDate || dateRange?.endDate ? {
          createdAt: {
            ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
            ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
          }
        } : {})
      },
    });
  }

  async update(
    data: Prisma.CommentUpdateInput,
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ): Promise<Comment> {
    return await db.comment.update({
      data,
      where: {
        id: ctx.CommentId,
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
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async remove(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ): Promise<Comment> {
    return await db.comment.delete({
      where: {
        id: ctx.CommentId,
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
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getMember(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ): Promise<WorkspaceMember | null> {
    return await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: ctx.workspaceId,
          userId: ctx.ActorId,
        },
      },
    });
  }
}
