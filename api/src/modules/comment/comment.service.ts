import { ActivityAction, Prisma } from "../../../prisma/generated/client.js";
import { AppError } from "../../common/errors/AppError.js";
import type { ResourceContext } from "../../common/types/common.types.js";
import type { DbClient } from "../../db/prisma.js";
import { ActivityService } from "../activity/activity.service.js";
import type { CommentRepo } from "./comment.repo.js";
import type { CreateBodyType, UpdateBodyType } from "./comment.schemas.js";

export class CommentService {
    constructor(
        readonly prisma: DbClient,
        readonly activityService: ActivityService,
        readonly commentRepo: CommentRepo,
    ) { };

    create = async (data: CreateBodyType, ctx: ResourceContext) => {

        const dataCreate: Prisma.CommentCreateInput = {
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

            await this.activityService.logActivity(
                ctx.workspaceId,
                ActivityAction.COMMENT_TASK,
                "comment",
                ctx.ActorId,
                comment.id,
                { comment },
                tx
            )

            return comment;
        });
    };

    reply = async (data: CreateBodyType, ctx: ResourceContext) => {

        const dataReply: Prisma.CommentCreateInput = {
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

            await this.activityService.logActivity(
                ctx.workspaceId,
                ActivityAction.COMMENT_TASK,
                "comment",
                ctx.ActorId,
                comment.id,
                { comment },
                tx
            );

            return comment;
        });
    };

    get = async (ctx: ResourceContext) => {
        const comment = await this.commentRepo.get(ctx);

        if (!comment) {
            throw new AppError("Comment not found", 404);
        };

        return comment;
    };

    listByTask = async (ctx: ResourceContext) => {
        return await this.commentRepo.listByTask(ctx);
    };

    update = async (data: UpdateBodyType, ctx: ResourceContext) => {
        const updateData: Prisma.CommentUpdateInput = {
            content: data.content
        }

        const comment = await this.commentRepo.update(updateData, ctx);

        return comment;
    };

    remove = async (ctx: ResourceContext) => {

        return await this.prisma.$transaction(async (tx) => {

            const comment = await this.commentRepo.remove(ctx, tx);

            await this.activityService.logActivity(
                ctx.workspaceId,
                ActivityAction.DELETE_COMMENT,
                "comment",
                ctx.ActorId,
                comment.id,
                { comment },
                tx
            );

            return comment;

        })
    };
}