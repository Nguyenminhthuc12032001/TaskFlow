import type { Prisma } from "../../../prisma/generated/client.js";
import { AppError } from "../../common/errors/AppError.js";
import type { DbClient } from "../../db/prisma.js";
import type { ColumnRepo } from "./column.repo.js";

export class ColumnService {
    constructor(
        readonly prisma: DbClient,
        readonly columnRepo: ColumnRepo
    ) { };

    create = async (data: any, workspaceId: string, actorId: string) => {

        const createData: Prisma.ColumnCreateInput = {
            name: data.name,
            position: data.position,
            project: {
                connect: {
                    id: data.projectId
                }
            }
        };

        return await this.columnRepo.create(createData);
    };

    listByProjectId = async (workspaceId: string, projectId: string, actorId: string) => {

        return await this.columnRepo.listByProject(workspaceId, projectId, actorId);

    };

    get = async (workspaceId: string, projectId: string, columnId: string, actorId: string) => {

        const column = await this.columnRepo.get(workspaceId, projectId, columnId, actorId);

        if (!column) {
            throw new AppError(`Column with id: ${columnId} not found`, 404);
        }

        return column;
    };

    update = async (data: any, workspaceId: string, projectId: string, columnId: string, actorId: string) => {

        const updateData: Prisma.ColumnUpdateInput = {
            name: data.name
        }

        return await this.columnRepo.update(data, workspaceId, projectId, columnId, actorId);
    };

    reOrder = async (data: { columnId: string; position: number }[], workspaceId: string, projectId: string, actorId: string) => {

        const result = await this.prisma.$transaction(async (tx) => {

            return await Promise.all(
                data.map(async ({ columnId, position }) => {

                    return await this.columnRepo.update({ position }, workspaceId, projectId, columnId, actorId, tx)
                }));
        });

        return result;
    };

    remove = async (workspaceId: string, projectId: string, columnId: string, actorId: string) => {
        return await this.columnRepo.remove(workspaceId, projectId, columnId, actorId);
    };
}