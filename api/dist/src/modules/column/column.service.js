import { ActivityAction } from "../../../prisma/generated/client.js";
import { AppError } from "../../common/errors/AppError.js";
export class ColumnService {
    constructor(prisma, columnRepo, activityService) {
        this.prisma = prisma;
        this.columnRepo = columnRepo;
        this.activityService = activityService;
        this.create = async (data, workspaceId, projectId, actorId) => {
            const columns = await this.columnRepo.listByProject(workspaceId, projectId, actorId);
            if (columns.some((c) => c.name === data.name)) {
                throw new AppError("Duplicate name is not allowed", 409);
            }
            ;
            if (columns.some((c) => c.position === data.position)) {
                throw new AppError("Duplicate position is not allowed", 409);
            }
            ;
            const createData = {
                name: data.name,
                position: data.position,
                type: data.type,
                project: {
                    connect: {
                        id: projectId
                    }
                }
            };
            return await this.prisma.$transaction(async (tx) => {
                const column = await this.columnRepo.create(createData, tx);
                await this.activityService.logActivity(workspaceId, ActivityAction.CREATE_COLUMN, "column", actorId, column.id, { name: column.name }, tx);
                return column;
            });
        };
        this.listByProjectId = async (workspaceId, projectId, actorId) => {
            return await this.columnRepo.listByProject(workspaceId, projectId, actorId);
        };
        this.get = async (workspaceId, projectId, columnId, actorId) => {
            const column = await this.columnRepo.get(workspaceId, projectId, columnId, actorId);
            if (!column) {
                throw new AppError(`Column with id: ${columnId} not found`, 404);
            }
            return column;
        };
        this.update = async (data, workspaceId, projectId, columnId, actorId) => {
            const columns = await this.columnRepo.listByProject(workspaceId, projectId, actorId);
            if (columns.some((c) => c.name === data.name && c.id !== columnId)) {
                throw new AppError("Duplicate name is not allowed", 409);
            }
            const updateData = {
                name: data.name
            };
            return await this.prisma.$transaction(async (tx) => {
                const column = await this.columnRepo.update(updateData, workspaceId, projectId, columnId, actorId);
                await this.activityService.logActivity(workspaceId, ActivityAction.UPDATE_COLUMN, "column", actorId, column.id, {
                    name: column.name,
                    position: column.position
                }, tx);
                return column;
            });
        };
        this.bulkUpdateStatus = async (data, ctx) => { };
        this.reOrder = async (data, workspaceId, projectId, actorId) => {
            const oldColumns = await this.columnRepo.listByProject(workspaceId, projectId, actorId);
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
            const result = await this.prisma.$transaction(async (tx) => {
                await Promise.all(data.map(async ({ columnId, position }) => {
                    return await this.columnRepo.update({ position: -(position + 1) }, workspaceId, projectId, columnId, actorId, tx);
                }));
                const columns = await Promise.all(data.map(async ({ columnId, position }) => {
                    return await this.columnRepo.update({ position }, workspaceId, projectId, columnId, actorId, tx);
                }));
                await this.activityService.logActivity(workspaceId, ActivityAction.UPDATE_COLUMN, "columns", actorId, undefined, {
                    new_columns: [
                        columns.map((c) => ({
                            id: c.id,
                            name: c.name,
                            position: c.position
                        }))
                    ]
                }, tx);
                return columns;
            });
            return result;
        };
        this.remove = async (workspaceId, projectId, columnId, actorId) => {
            return this.prisma.$transaction(async (tx) => {
                const column = await this.columnRepo.remove(workspaceId, projectId, columnId, actorId, tx);
                await this.activityService.logActivity(workspaceId, ActivityAction.DELETE_COLUMN, "column", actorId, column.id, {
                    name: column.name,
                    position: column.position
                }, tx);
                return column;
            });
        };
    }
    ;
}
