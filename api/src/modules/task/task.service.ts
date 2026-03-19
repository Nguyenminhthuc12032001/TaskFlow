import { ActivityAction, type Prisma } from "../../../prisma/generated/client.js";
import { AppError } from "../../common/errors/AppError.js";
import type { ResourceContext } from "../../common/types/common.types.js";
import type { DbClient } from "../../db/prisma.js";
import { ActivityService } from "../activity/activity.service.js";
import type { TaskRepo } from "./task.repo.js";
import type { AssignBodyType, BulkRemoveBodyType, CreateBodyType, ReOrderBodyType, UpdateBodyType } from "./task.schemas.js";

export class TaskService {
    constructor(
        readonly prisma: DbClient,
        readonly activityService: ActivityService,
        readonly taskRepo: TaskRepo
    ) { };

    create = async (data: CreateBodyType, ctx: ResourceContext) => {

        const result = await this.prisma.$transaction(async (tx) => {

            const tasks = await this.taskRepo.listByColumn(ctx, tx);

            if (tasks.some((t) => t.title.toLowerCase() === data.title.toLowerCase())) {
                throw new AppError("Duplicate task title is not allowed");
            }

            const createData: Prisma.TaskCreateInput = {
                title: data.title,
                priority: data.priority,
                position: data.position,
                description: data.description ?? "",
                dueDate: data.dueDate ?? null,
                project: {
                    connect: {
                        id: ctx.projectId
                    }
                },
                column: {
                    connect: {
                        id: ctx.columnId
                    }
                },
                creator: {
                    connect: {
                        id: ctx.ActorId
                    }
                }
            }

            const task = await this.taskRepo.create(createData, tx);

            await this.activityService.logActivity(
                ctx.workspaceId,
                ActivityAction.CREATE_TASK,
                "task",
                ctx.ActorId,
                task.id,
                { title: task.title, position: task.position },
                tx
            )

            return task;
        });

        return result;
    };

    assign = async (data: AssignBodyType, ctx: ResourceContext) => {

        const result = await this.prisma.$transaction(async (tx) => {

            const existAssignee = await this.taskRepo.isExistAssignee(data.userId, ctx, tx);

            if (existAssignee) {
                throw new AppError("User is already assigned to this task")
            };

            const assignData: Prisma.TaskAssigneeCreateInput = {
                task: {
                    connect: {
                        id: ctx.TaskId
                    }
                },
                user: {
                    connect: {
                        id: data.userId
                    }
                }
            }

            const assignee = await this.taskRepo.assign(assignData, tx);

            await this.activityService.logActivity(
                ctx.workspaceId,
                ActivityAction.ASSIGN_TASK,
                "task_assignee",
                ctx.ActorId,
                assignee.taskId,
                { userId: assignee.userId, taskId: assignee.taskId },
                tx
            )

            return assignee;
        })

        return result;
    };

    get = async (ctx: ResourceContext) => {
        const task = await this.taskRepo.get(ctx);

        if (!task) {
            throw new AppError("Task not found", 404);
        }

        return task;
    };

    listByColumn = async (ctx: ResourceContext) => {
        return await this.taskRepo.listByColumn(ctx);
    };

    update = async (data: UpdateBodyType, ctx: ResourceContext) => {
        const tasks = await this.taskRepo.listByColumn(ctx);

        if (tasks.some((t) => t.title.toLowerCase() === (data.title?.toLowerCase() ?? ""))) {
            throw new AppError("Duplicate title is not allowed");
        }

        const updateData: Prisma.TaskUpdateInput = {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.priority !== undefined && { priority: data.priority }),
            ...(data.position !== undefined && { position: data.position }),
            ...(data.dueDate !== undefined && { dueDate: data.dueDate })
        }

        const result = await this.prisma.$transaction(async (tx) => {

            const task = await this.taskRepo.update(updateData, ctx);

            await this.activityService.logActivity(
                ctx.workspaceId,
                ActivityAction.UPDATE_TASK,
                "task",
                ctx.ActorId,
                ctx.TaskId,
                { tasks },
                tx
            )

            return task;
        })

        return result;
    };

    reOrder = async (data: ReOrderBodyType, ctx: ResourceContext) => {
        return await this.prisma.$transaction(async (tx) => {
            await Promise.all(
                data.map(async ({ taskId, position }) => {
                    return await this.taskRepo.update({ position: - (position + 1) }, { ...ctx, TaskId: taskId }, tx);
                })
            )

            const result = await Promise.all(
                data.map(async ({ taskId, position }) => {
                    return await this.taskRepo.update({ position }, { ...ctx, TaskId: taskId }, tx);
                })
            )

            await this.activityService.logActivity(
                ctx.workspaceId,
                ActivityAction.UPDATE_TASK,
                "tasks",
                ctx.ActorId,
                undefined,
                { result },
                tx
            )

            return result;
        })
    };

    archivTask = async (ctx: ResourceContext) => {
        return await this.taskRepo.archivTask(ctx);
    };

    restoreTask = async (ctx: ResourceContext) => {
        return await this.taskRepo.restoreTask(ctx);
    };

    remove = async (ctx: ResourceContext) => {

        return await this.prisma.$transaction(async (tx) => {

            const task = await this.taskRepo.remove(ctx);

            await this.activityService.logActivity(
                ctx.workspaceId,
                ActivityAction.DELETE_TASK,
                "task",
                ctx.ActorId,
                ctx.TaskId,
                { task },
                tx
            );

            return task;
        })
    };

    bulkRemove = async (data: BulkRemoveBodyType, ctx: ResourceContext) => {
        const result = await this.prisma.$transaction(async (tx) => {
            const tasks = await Promise.all(
                data.map(async ({ taskId }) => {
                    return await this.taskRepo.remove({ ...ctx, TaskId: taskId }, tx);
                })
            )

            await this.activityService.logActivity(
                ctx.workspaceId,
                ActivityAction.DELETE_TASK,
                "tasks",
                ctx.ActorId,
                undefined,
                { tasks },
                tx
            )

            return tasks;
        })

        return result;
    };
};