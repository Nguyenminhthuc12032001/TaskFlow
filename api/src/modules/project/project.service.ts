import { ActivityAction, ColumnType, type Prisma } from "../../../prisma/generated/client.js"
import type { ProjectUpdateInput } from "../../../prisma/generated/models.js"
import { AppError } from "../../common/errors/AppError.js"
import type { DbClient, DbOrTxClient } from "../../db/prisma.js"
import type { ActivityService } from "../activity/activity.service.js"

import { ProjectRepo } from "./project.repo.js"
import type { CreateBodyType, UpdateBodyType } from "./project.schemas.js"

export class ProjectService {
    constructor(
        readonly prisma: DbClient,
        readonly projectRepo: ProjectRepo,

        readonly activityService: ActivityService
    ) { };

    create = async (data: CreateBodyType, workspaceId: string, actorId: string) => {

        const projects = await this.projectRepo.listByWorkspace(workspaceId, actorId);

        if (projects.some((p) => p.name === data.name)) {
            throw new AppError("Duplicate name is not allowed", 409);
        }

        const createData: Prisma.ProjectCreateInput = {
            name: data.name,
            description: data.description,
            workspace: {
                connect: {
                    id: workspaceId,
                    members: {
                        some: {
                            userId: actorId,
                            role: {
                                in: ["admin", "owner"]
                            }
                        }
                    }
                }
            },
            creator: { connect: { id: actorId } }
        };

        return await this.prisma.$transaction(async (tx) => {

            const project = await this.projectRepo.create(createData, tx);

            await tx.column.createMany({
                data: [
                    { name: "Todo", position: 1, type: ColumnType.todo, projectId: project.id },
                    { name: "In Progress", position: 2, type: ColumnType.in_process, projectId: project.id },
                    { name: "Done", position: 3, type: ColumnType.done, projectId: project.id }
                ]
            });

            await this.activityService.logActivity(
                project.workspaceId,
                ActivityAction.CREATE_PROJECT,
                "project",
                actorId,
                project.id,
                { name: project.name },
                tx
            );

            return project;
        });
    };

    get = async (id: string, workspaceId: string, actorId: string) => {
        const result = await this.projectRepo.get(id, workspaceId, actorId);
        if (!result) {
            throw new AppError("Project not found", 404);
        };

        return result;
    };

    listByWorkspace = async (workspaceId: string, actorId: string) => {
        return await this.projectRepo.listByWorkspace(workspaceId, actorId);
    };

    listByUser = async (actorId: string) => {
        return await this.projectRepo.listByUser(actorId);
    };

    update = async (data: UpdateBodyType, workspaceId: string, projectId: string, actorId: string) => {

        const projects = await this.projectRepo.listByWorkspace(workspaceId, actorId);

        if (projects.some((p) => p.name === data.name && p.id !== projectId)) {
            throw new AppError("Duplicate name is not allowed", 409);
        };

        const updateData: ProjectUpdateInput = {
            name: data.name,
            description: data.description
        };

        return await this.prisma.$transaction(async (tx) => {

            const project = await this.projectRepo.update(updateData, workspaceId, projectId, actorId, tx);

            await this.activityService.logActivity(
                project.workspaceId,
                ActivityAction.UPDATE_PROJECT,
                "project",
                actorId,
                project.id,
                { name: project.name },
                tx
            );

            return project
        });

    };

    remove = async (id: string, actorId: string) => {

        return await this.prisma.$transaction(async (tx) => {

            const project = await this.projectRepo.remove(id, actorId, tx);

            await this.activityService.logActivity(
                project.workspaceId,
                ActivityAction.DELETE_PROJECT,
                "project",
                actorId,
                project.id,
                { name: project.name },
                tx
            );

            return project;
        });
    };
}
