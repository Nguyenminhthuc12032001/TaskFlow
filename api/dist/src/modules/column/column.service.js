import { ActivityAction } from '../../../prisma/generated/client.js';
import { AppError } from '../../common/errors/AppError.js';
import { buildPagination, buildPaginationMeta } from '../../common/utils/pagination.js';
export class ColumnService {
    constructor(prisma, columnRepo, activityService) {
        this.prisma = prisma;
        this.columnRepo = columnRepo;
        this.activityService = activityService;
    }
    async create(data, ctx) {
        const columns = await this.columnRepo.allColumnsByProject(ctx);
        if (columns.some((c) => c.name === data.name)) {
            throw new AppError('Duplicate name is not allowed', 409);
        }
        if (columns.some((c) => c.position === data.position)) {
            throw new AppError('Duplicate position is not allowed', 409);
        }
        const createData = {
            name: data.name,
            position: data.position,
            type: data.type,
            project: {
                connect: {
                    id: ctx.projectId,
                },
            },
        };
        return await this.prisma.$transaction(async (tx) => {
            const column = await this.columnRepo.create(createData, tx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.CREATE_COLUMN, 'column', ctx.ActorId, column.id, { name: column.name }, tx);
            return column;
        });
    }
    async listByProjectId(ctx, paginationQuery) {
        const { safePage, safeLimit, skip, take } = buildPagination(paginationQuery.page, paginationQuery.limit);
        const countColumns = await this.columnRepo.countColumnsByProject(ctx);
        const paginationMeta = buildPaginationMeta(safePage, safeLimit, countColumns);
        const columns = await this.columnRepo.listByProject(ctx, { skip, take });
        return { columns, paginationMeta };
    }
    async get(ctx) {
        const column = await this.columnRepo.get(ctx);
        if (!column) {
            throw new AppError(`Column with id: ${ctx.columnId} not found`, 404);
        }
        return column;
    }
    async update(data, ctx) {
        const columns = await this.columnRepo.allColumnsByProject(ctx);
        if (columns.some((c) => c.name === data.name && c.id !== ctx.columnId)) {
            throw new AppError('Duplicate name is not allowed', 409);
        }
        const updateData = {
            name: data.name,
        };
        return await this.prisma.$transaction(async (tx) => {
            const column = await this.columnRepo.update(updateData, ctx, tx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.UPDATE_COLUMN, 'column', ctx.ActorId, column.id, {
                name: column.name,
                position: column.position,
            }, tx);
            return column;
        });
    }
    async bulkUpdateStatus(data, ctx) { }
    async reOrder(data, ctx, paginationQuery) {
        const oldColumns = await this.columnRepo.allColumnsByProject(ctx);
        oldColumns.map((c) => {
            if (!data.some((d) => d.columnId === c.id)) {
                throw new AppError(`Column with id: ${c.id} not found in request`, 404);
            }
        });
        data.map((d) => {
            if (!oldColumns.some((c) => c.id === d.columnId)) {
                throw new AppError(`Column with id: ${d.columnId} not found in database`, 404);
            }
        });
        await this.prisma.$transaction(async (tx) => {
            await Promise.all(data.map(async ({ columnId, position }) => {
                return await this.columnRepo.update({ position: -(position + 1) }, { ...ctx, columnId }, tx);
            }));
            const columns = await Promise.all(data.map(async ({ columnId, position }) => {
                return await this.columnRepo.update({ position }, { ...ctx, columnId }, tx);
            }));
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.UPDATE_COLUMN, 'columns', ctx.ActorId, undefined, {
                new_columns: [
                    columns.map((c) => ({
                        id: c.id,
                        name: c.name,
                        position: c.position,
                    })),
                ],
            }, tx);
        });
        const { safePage, safeLimit, skip, take } = buildPagination(paginationQuery.page, paginationQuery.limit);
        const countColumns = await this.columnRepo.countColumnsByProject(ctx);
        const paginationMeta = buildPaginationMeta(safePage, safeLimit, countColumns);
        const columns = await this.columnRepo.listByProject(ctx, { skip, take });
        return { columns, paginationMeta };
    }
    async remove(ctx) {
        return this.prisma.$transaction(async (tx) => {
            const column = await this.columnRepo.remove(ctx, tx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.DELETE_COLUMN, 'column', ctx.ActorId, column.id, {
                name: column.name,
                position: column.position,
            }, tx);
            return column;
        });
    }
}
