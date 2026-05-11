import { ActivityAction, Prisma, type Comment } from '../../../prisma/generated/client.js';
import { AppError } from '../../common/errors/AppError.js';
import type { PaginationMetaType } from '../../common/schemas/common.schemas.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import { buildDateRange } from '../../common/utils/dateRange.js';
import { buildPagination, buildPaginationMeta } from '../../common/utils/pagination.js';
import type { DbClient } from '../../db/prisma.js';
import { ActivityService } from '../activity/activity.service.js';
import type { CommentRepo } from './comment.repo.js';
import type { CreateBodyType, ListCommentsQueryType, UpdateBodyType } from './comment.schemas.js';

export class CommentService {
  constructor(
    readonly prisma: DbClient,
    readonly activityService: ActivityService,
    readonly commentRepo: CommentRepo,
  ) {}

  async create(data: CreateBodyType, ctx: ResourceContext): Promise<Comment> {
    const dataCreate: Prisma.CommentCreateInput = {
      content: data.content,
      task: {
        connect: {
          id: ctx.TaskId,
        },
      },
      author: {
        connect: {
          id: ctx.ActorId,
        },
      },
    };

    return await this.prisma.$transaction(async (tx) => {
      const comment = await this.commentRepo.create(dataCreate, tx);

      await this.activityService.logActivity(
        ctx.workspaceId,
        ActivityAction.COMMENT_TASK,
        'comment',
        ctx.ActorId,
        comment.id,
        { comment },
        tx,
      );

      return comment;
    });
  }

  async reply(data: CreateBodyType, ctx: ResourceContext): Promise<Comment> {
    const dataReply: Prisma.CommentCreateInput = {
      content: data.content,
      parent: {
        connect: {
          id: ctx.CommentId,
        },
      },
      task: {
        connect: {
          id: ctx.TaskId,
        },
      },
      author: {
        connect: {
          id: ctx.ActorId,
        },
      },
    };

    return await this.prisma.$transaction(async (tx) => {
      const comment = await this.commentRepo.create(dataReply, tx);

      await this.activityService.logActivity(
        ctx.workspaceId,
        ActivityAction.COMMENT_TASK,
        'comment',
        ctx.ActorId,
        comment.id,
        { comment },
        tx,
      );

      return comment;
    });
  }

  async get(ctx: ResourceContext): Promise<Comment> {
    const comment = await this.commentRepo.get(ctx);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    return comment;
  }

  async listByTask(
    ctx: ResourceContext,
    listCommentsQuery: ListCommentsQueryType,
  ): Promise<{ comments: Comment[]; paginationMeta: PaginationMetaType }> {
    const { safePage, safeLimit, skip, take } = buildPagination(
      listCommentsQuery.page,
      listCommentsQuery.limit,
    );

    const dateRange = buildDateRange({
      startDate: listCommentsQuery.startDate,
      endDate: listCommentsQuery.endDate,
    });

    const countComments = await this.commentRepo.countCommentsByTask(
      ctx,
      listCommentsQuery.search,
      dateRange,
      listCommentsQuery.parentId,
    );

    const paginationMeta: PaginationMetaType = buildPaginationMeta(
      safePage,
      safeLimit,
      countComments,
    );

    const comments = await this.commentRepo.listByTask(
      ctx,
      listCommentsQuery.search,
      dateRange,
      listCommentsQuery.parentId,
      { skip, take },
    );

    return { comments, paginationMeta };
  }

  async update(data: UpdateBodyType, ctx: ResourceContext): Promise<Comment> {
    const comment = await this.commentRepo.get(ctx);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.authorId !== ctx.ActorId) {
      throw new AppError("You don't have permission to delete this comment", 403);
    }

    const updateData: Prisma.CommentUpdateInput = {
      content: data.content,
    };

    return await this.commentRepo.update(updateData, ctx);
  }

  async remove(ctx: ResourceContext): Promise<Comment> {
    const comment = await this.commentRepo.get(ctx);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    const actor = await this.commentRepo.getMember(ctx);
    if (!actor) {
      throw new AppError('Member not found', 404);
    }

    if (comment.authorId !== ctx.ActorId && !['admin', 'owner'].includes(actor.role)) {
      throw new AppError("You don't have permission to delete this comment", 403);
    }

    return await this.prisma.$transaction(async (tx) => {
      const comment = await this.commentRepo.remove(ctx, tx);

      await this.activityService.logActivity(
        ctx.workspaceId,
        ActivityAction.DELETE_COMMENT,
        'comment',
        ctx.ActorId,
        comment.id,
        { comment },
        tx,
      );

      return comment;
    });
  }
}
