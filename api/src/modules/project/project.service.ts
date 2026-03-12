import { ActivityAction, type Prisma } from "../../../prisma/generated/client.js"
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

    create = async (data: CreateBodyType, actorId: string) => {

        const createData: Prisma.ProjectCreateInput = {
            name: data.name,
            description: data.description,
            workspace: { connect: { id: data.workspaceId } },
            creator: { connect: { id: actorId } }
        };

        return await this.prisma.$transaction(async (tx) => {

            const project = await this.projectRepo.create(createData, tx);

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

    update = async (data: UpdateBodyType, id: string, actorId: string) => {

        const updateData: ProjectUpdateInput = {
            name: data.name,
            description: data.description
        };

        return await this.prisma.$transaction(async (tx) => {

            const project = await this.projectRepo.update(updateData, id, actorId, tx);

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