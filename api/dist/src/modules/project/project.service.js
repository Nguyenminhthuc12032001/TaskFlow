import { ActivityAction, ColumnType } from '../../../prisma/generated/client.js';
import { AppError } from '../../common/errors/AppError.js';
export class ProjectService {
    constructor(prisma, projectRepo, activityService) {
        this.prisma = prisma;
        this.projectRepo = projectRepo;
        this.activityService = activityService;
    }
    async create(data, workspaceId, actorId) {
        const projects = await this.projectRepo.listByWorkspace(workspaceId, actorId);
        if (projects.some((p) => p.name === data.name)) {
            throw new AppError('Duplicate name is not allowed', 409);
        }
        const createData = {
            name: data.name,
            description: data.description,
            workspace: {
                connect: {
                    id: workspaceId,
                    members: {
                        some: {
                            userId: actorId,
                            role: {
                                in: ['admin', 'owner'],
                            },
                        },
                    },
                },
            },
            creator: { connect: { id: actorId } },
        };
        return await this.prisma.$transaction(async (tx) => {
            const project = await this.projectRepo.create(createData, tx);
            await tx.column.createMany({
                data: [
                    { name: 'Todo', position: 1, type: ColumnType.todo, projectId: project.id },
                    { name: 'In Progress', position: 2, type: ColumnType.in_process, projectId: project.id },
                    { name: 'Done', position: 3, type: ColumnType.done, projectId: project.id },
                ],
            });
            await this.activityService.logActivity(project.workspaceId, ActivityAction.CREATE_PROJECT, 'project', actorId, project.id, { name: project.name }, tx);
            return project;
        });
    }
    async get(id, workspaceId, actorId) {
        const result = await this.projectRepo.get(id, workspaceId, actorId);
        if (!result) {
            throw new AppError('Project not found', 404);
        }
        return result;
    }
    async listByWorkspace(workspaceId, actorId) {
        return await this.projectRepo.listByWorkspace(workspaceId, actorId);
    }
    async listByUser(actorId) {
        return await this.projectRepo.listByUser(actorId);
    }
    async update(data, workspaceId, projectId, actorId) {
        const projects = await this.projectRepo.listByWorkspace(workspaceId, actorId);
        if (projects.some((p) => p.name === data.name && p.id !== projectId)) {
            throw new AppError('Duplicate name is not allowed', 409);
        }
        const updateData = {
            name: data.name,
            description: data.description,
        };
        return await this.prisma.$transaction(async (tx) => {
            const project = await this.projectRepo.update(updateData, workspaceId, projectId, actorId, tx);
            await this.activityService.logActivity(project.workspaceId, ActivityAction.UPDATE_PROJECT, 'project', actorId, project.id, { name: project.name }, tx);
            return project;
        });
    }
    async remove(id, actorId) {
        return await this.prisma.$transaction(async (tx) => {
            const project = await this.projectRepo.remove(id, actorId, tx);
            await this.activityService.logActivity(project.workspaceId, ActivityAction.DELETE_PROJECT, 'project', actorId, project.id, { name: project.name }, tx);
            return project;
        });
    }
}
