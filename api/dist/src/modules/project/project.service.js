import { ActivityAction, ColumnType } from '../../../prisma/generated/client.js';
import { AppError } from '../../common/errors/AppError.js';
import { buildPagination, buildPaginationMeta } from '../../common/utils/pagination.js';
export class ProjectService {
    constructor(prisma, projectRepo, activityService) {
        this.prisma = prisma;
        this.projectRepo = projectRepo;
        this.activityService = activityService;
    }
    async create(data, ctx) {
        const projects = await this.projectRepo.allProjectsByWorkspace(ctx);
        if (projects.some((p) => p.name === data.name)) {
            throw new AppError('Duplicate name is not allowed', 409);
        }
        const createData = {
            name: data.name,
            description: data.description,
            workspace: {
                connect: {
                    id: ctx.workspaceId,
                    members: {
                        some: {
                            userId: ctx.ActorId,
                            role: {
                                in: ['admin', 'owner'],
                            },
                        },
                    },
                },
            },
            creator: { connect: { id: ctx.ActorId } },
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
            await this.activityService.logActivity(project.workspaceId, ActivityAction.CREATE_PROJECT, 'project', ctx.ActorId, project.id, { name: project.name }, tx);
            return project;
        });
    }
    async get(ctx) {
        const result = await this.projectRepo.get(ctx);
        if (!result) {
            throw new AppError('Project not found', 404);
        }
        return result;
    }
    async listByWorkspace(ctx, paginationQuery) {
        const { safePage, safeLimit, take, skip } = buildPagination(paginationQuery.page, paginationQuery.limit);
        const countProjectsByWorkspace = await this.projectRepo.countProjectsByWorkspace(ctx);
        const paginationMeta = buildPaginationMeta(safePage, safeLimit, countProjectsByWorkspace);
        const projects = await this.projectRepo.listByWorkspace(ctx, { take, skip });
        return { projects, paginationMeta };
    }
    async listByUser(actorId) {
        return await this.projectRepo.listByUser(actorId);
    }
    async update(data, ctx) {
        const projects = await this.projectRepo.allProjectsByWorkspace(ctx);
        if (projects.some((p) => p.name.toLowerCase() === data.name.toLocaleLowerCase() && p.id !== ctx.projectId)) {
            throw new AppError('Duplicate name is not allowed', 409);
        }
        const updateData = {
            name: data.name,
            description: data.description,
        };
        return await this.prisma.$transaction(async (tx) => {
            const project = await this.projectRepo.update(updateData, ctx, tx);
            await this.activityService.logActivity(project.workspaceId, ActivityAction.UPDATE_PROJECT, 'project', ctx.ActorId, project.id, { name: project.name }, tx);
            return project;
        });
    }
    async remove(ctx) {
        return await this.prisma.$transaction(async (tx) => {
            const project = await this.projectRepo.remove(ctx, tx);
            await this.activityService.logActivity(project.workspaceId, ActivityAction.DELETE_PROJECT, 'project', ctx.ActorId, project.id, { name: project.name }, tx);
            return project;
        });
    }
}
