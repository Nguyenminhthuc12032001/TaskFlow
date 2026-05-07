import { ActivityAction } from '../../../prisma/generated/client.js';
import { AppError } from '../../common/errors/AppError.js';
import { buildDateRange } from '../../common/utils/dateRange.js';
import { buildPagination, buildPaginationMeta } from '../../common/utils/pagination.js';
export class CommentService {
    constructor(prisma, activityService, commentRepo) {
        this.prisma = prisma;
        this.activityService = activityService;
        this.commentRepo = commentRepo;
    }
    async create(data, ctx) {
        const dataCreate = {
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
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.COMMENT_TASK, 'comment', ctx.ActorId, comment.id, { comment }, tx);
            return comment;
        });
    }
    async reply(data, ctx) {
        const dataReply = {
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
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.COMMENT_TASK, 'comment', ctx.ActorId, comment.id, { comment }, tx);
            return comment;
        });
    }
    async get(ctx) {
        const comment = await this.commentRepo.get(ctx);
        if (!comment) {
            throw new AppError('Comment not found', 404);
        }
        return comment;
    }
    async listByTask(ctx, listCommentsQuery) {
        const { safePage, safeLimit, skip, take } = buildPagination(listCommentsQuery.page, listCommentsQuery.limit);
        const dateRange = buildDateRange({
            startDate: listCommentsQuery.startDate,
            endDate: listCommentsQuery.endDate
        });
        const countComments = await this.commentRepo.countCommentsByTask(ctx, listCommentsQuery.search, dateRange, listCommentsQuery.parentId);
        const paginationMeta = buildPaginationMeta(safePage, safeLimit, countComments);
        const comments = await this.commentRepo.listByTask(ctx, listCommentsQuery.search, dateRange, listCommentsQuery.parentId, { skip, take });
        return { comments, paginationMeta };
    }
    async update(data, ctx) {
        const comment = await this.commentRepo.get(ctx);
        if (!comment) {
            throw new AppError('Comment not found', 404);
        }
        if (comment.authorId !== ctx.ActorId) {
            throw new AppError("You don't have permission to delete this comment", 403);
        }
        const updateData = {
            content: data.content,
        };
        return await this.commentRepo.update(updateData, ctx);
    }
    async remove(ctx) {
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
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.DELETE_COMMENT, 'comment', ctx.ActorId, comment.id, { comment }, tx);
            return comment;
        });
    }
}
