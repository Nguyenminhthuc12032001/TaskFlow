import { ActivityAction } from "../../../prisma/generated/client.js";
import { AppError } from "../../common/errors/AppError.js";
export class CommentService {
    constructor(prisma, activityService, commentRepo) {
        this.prisma = prisma;
        this.activityService = activityService;
        this.commentRepo = commentRepo;
        this.create = async (data, ctx) => {
            const dataCreate = {
                content: data.content,
                task: {
                    connect: {
                        id: ctx.TaskId
                    }
                },
                author: {
                    connect: {
                        id: ctx.ActorId
                    }
                }
            };
            return await this.prisma.$transaction(async (tx) => {
                const comment = await this.commentRepo.create(dataCreate, tx);
                await this.activityService.logActivity(ctx.workspaceId, ActivityAction.COMMENT_TASK, "comment", ctx.ActorId, comment.id, { comment }, tx);
                return comment;
            });
        };
        this.reply = async (data, ctx) => {
            const dataReply = {
                content: data.content,
                parent: {
                    connect: {
                        id: ctx.CommentId
                    }
                },
                task: {
                    connect: {
                        id: ctx.TaskId
                    }
                },
                author: {
                    connect: {
                        id: ctx.ActorId
                    }
                }
            };
            return await this.prisma.$transaction(async (tx) => {
                const comment = await this.commentRepo.create(dataReply, tx);
                await this.activityService.logActivity(ctx.workspaceId, ActivityAction.COMMENT_TASK, "comment", ctx.ActorId, comment.id, { comment }, tx);
                return comment;
            });
        };
        this.get = async (ctx) => {
            const comment = await this.commentRepo.get(ctx);
            if (!comment) {
                throw new AppError("Comment not found", 404);
            }
            ;
            return comment;
        };
        this.listByTask = async (ctx) => {
            return await this.commentRepo.listByTask(ctx);
        };
        this.update = async (data, ctx) => {
            const updateData = {
                content: data.content
            };
            const comment = await this.commentRepo.update(updateData, ctx);
            return comment;
        };
        this.remove = async (ctx) => {
            return await this.prisma.$transaction(async (tx) => {
                const comment = await this.commentRepo.remove(ctx, tx);
                await this.activityService.logActivity(ctx.workspaceId, ActivityAction.DELETE_COMMENT, "comment", ctx.ActorId, comment.id, { comment }, tx);
                return comment;
            });
        };
    }
    ;
}
