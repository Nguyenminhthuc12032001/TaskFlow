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
  ) { }

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

  async reply(data: CreateBodyType, ctx: ResourceContext): Promise<{ comment: Comment; totalReplies: number }> {
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

      const totalReplies = await this.commentRepo.getTotalReplies({ ...ctx, CommentId: ctx.CommentId });

      return { comment, totalReplies };
    });
  }

  async get(ctx: ResourceContext): Promise<{ comment: Comment; totalReplies: number }> {
    const comment = await this.commentRepo.get(ctx);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    const totalReplies = await this.commentRepo.getTotalReplies(ctx);

    return { comment, totalReplies };
  }

  async listByTask(
    ctx: ResourceContext,
    listCommentsQuery: ListCommentsQueryType,
  ): Promise<{ commentsWithTotalReplies: (Comment & { totalReplies: number })[]; paginationMeta: PaginationMetaType }> {
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

    const commentsWithTotalReplies = await Promise.all(
      comments.map(async (comment) => {
        const totalReplies = await this.commentRepo.getTotalReplies({ ...ctx, CommentId: comment.id });
        return { ...comment, totalReplies };
      })
    )

    return { commentsWithTotalReplies, paginationMeta };
  }

  async update(data: UpdateBodyType, ctx: ResourceContext): Promise<{ commentUpdated: Comment; totalReplies: number }> {
    const comment = await this.commentRepo.get(ctx);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.authorId !== ctx.ActorId) {
      throw new AppError("You don't have permission to update this comment", 403, 'NOT_COMMENT_AUTHOR');
    }

    const updateData: Prisma.CommentUpdateInput = {
      content: data.content,
    };

    const totalReplies = await this.commentRepo.getTotalReplies(ctx);

    const commentUpdated = await this.commentRepo.update(updateData, ctx);

    return {
      commentUpdated,
      totalReplies,
    };
  }

  async remove(ctx: ResourceContext): Promise<{ comment: Comment; totalReplies: number }> {
    const comment = await this.commentRepo.get(ctx);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    const actor = await this.commentRepo.getMember(ctx);
    if (!actor) {
      throw new AppError('Member not found', 404);
    }

    if (comment.authorId !== ctx.ActorId && !['admin', 'owner'].includes(actor.role)) {
      throw new AppError("You don't have permission to delete this comment", 403, 'NOT_COMMENT_AUTHOR');
    }

    return await this.prisma.$transaction(async (tx) => {
      const comment = await this.commentRepo.remove(ctx, tx);

      const totalReplies = await this.commentRepo.getTotalReplies(ctx);

      await this.activityService.logActivity(
        ctx.workspaceId,
        ActivityAction.DELETE_COMMENT,
        'comment',
        ctx.ActorId,
        comment.id,
        { comment },
        tx,
      );

      return { comment, totalReplies };
    });
  }
}
