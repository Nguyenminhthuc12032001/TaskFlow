import { ActivityAction } from "../../../prisma/generated/client.js";
import { AppError } from "../../common/errors/AppError.js";
export class ProjectService {
    constructor(prisma, projectRepo, activityService) {
        this.prisma = prisma;
        this.projectRepo = projectRepo;
        this.activityService = activityService;
        this.create = async (data, actorId) => {
            const createData = {
                name: data.name,
                description: data.description,
                workspace: { connect: { id: data.workspaceId } },
                creator: { connect: { id: actorId } }
            };
            return await this.prisma.$transaction(async (tx) => {
                const project = await this.projectRepo.create(createData, tx);
                await this.activityService.logActivity(project.workspaceId, ActivityAction.CREATE_PROJECT, "project", actorId, project.id, { name: project.name }, tx);
                return project;
            });
        };
        this.get = async (id, workspaceId, actorId) => {
            const result = await this.projectRepo.get(id, workspaceId, actorId);
            if (!result) {
                throw new AppError("Project not found", 404);
            }
            ;
            return result;
        };
        this.listByWorkspace = async (workspaceId, actorId) => {
            return await this.projectRepo.listByWorkspace(workspaceId, actorId);
        };
        this.listByUser = async (actorId) => {
            return await this.projectRepo.listByUser(actorId);
        };
        this.update = async (data, id, actorId) => {
            const updateData = {
                name: data.name,
                description: data.description
            };
            return await this.prisma.$transaction(async (tx) => {
                const project = await this.projectRepo.update(updateData, id, actorId, tx);
                await this.activityService.logActivity(project.workspaceId, ActivityAction.UPDATE_PROJECT, "project", actorId, project.id, { name: project.name }, tx);
                return project;
            });
        };
        this.remove = async (id, actorId) => {
            return await this.prisma.$transaction(async (tx) => {
                const project = await this.projectRepo.remove(id, actorId, tx);
                await this.activityService.logActivity(project.workspaceId, ActivityAction.DELETE_PROJECT, "project", actorId, project.id, { name: project.name }, tx);
                return project;
            });
        };
    }
    ;
}
