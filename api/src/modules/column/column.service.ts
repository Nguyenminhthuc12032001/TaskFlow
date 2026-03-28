import { ActivityAction, type Prisma } from '../../../prisma/generated/client.js';
import { AppError } from '../../common/errors/AppError.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import type { DbClient } from '../../db/prisma.js';
import type { ActivityService } from '../activity/activity.service.js';
import type { ColumnRepo } from './column.repo.js';
import type { CreateBodyType, ReOrderBodyType, UpdateBodyType } from './column.schemas.js';

export class ColumnService {
  constructor(
    readonly prisma: DbClient,
    readonly columnRepo: ColumnRepo,
    readonly activityService: ActivityService,
  ) {}

  create = async (
    data: CreateBodyType,
    workspaceId: string,
    projectId: string,
    actorId: string,
  ) => {
    const columns = await this.columnRepo.listByProject(workspaceId, projectId, actorId);

    if (columns.some((c) => c.name === data.name)) {
      throw new AppError('Duplicate name is not allowed', 409);
    }

    if (columns.some((c) => c.position === data.position)) {
      throw new AppError('Duplicate position is not allowed', 409);
    }

    const createData: Prisma.ColumnCreateInput = {
      name: data.name,
      position: data.position,
      type: data.type,
      project: {
        connect: {
          id: projectId,
        },
      },
    };

    return await this.prisma.$transaction(async (tx) => {
      const column = await this.columnRepo.create(createData, tx);

      await this.activityService.logActivity(
        workspaceId,
        ActivityAction.CREATE_COLUMN,
        'column',
        actorId,
        column.id,
        { name: column.name },
        tx,
      );

      return column;
    });
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

  update = async (
    data: UpdateBodyType,
    workspaceId: string,
    projectId: string,
    columnId: string,
    actorId: string,
  ) => {
    const columns = await this.columnRepo.listByProject(workspaceId, projectId, actorId);

    if (columns.some((c) => c.name === data.name && c.id !== columnId)) {
      throw new AppError('Duplicate name is not allowed', 409);
    }

    const updateData: Prisma.ColumnUpdateInput = {
      name: data.name,
    };

    return await this.prisma.$transaction(async (tx) => {
      const column = await this.columnRepo.update(
        updateData,
        workspaceId,
        projectId,
        columnId,
        actorId,
      );

      await this.activityService.logActivity(
        workspaceId,
        ActivityAction.UPDATE_COLUMN,
        'column',
        actorId,
        column.id,
        {
          name: column.name,
          position: column.position,
        },
        tx,
      );

      return column;
    });
  };

  bulkUpdateStatus = async (data: any, ctx: ResourceContext) => {};

  reOrder = async (
    data: ReOrderBodyType,
    workspaceId: string,
    projectId: string,
    actorId: string,
  ) => {
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
      await Promise.all(
        data.map(async ({ columnId, position }) => {
          return await this.columnRepo.update(
            { position: -(position + 1) },
            workspaceId,
            projectId,
            columnId,
            actorId,
            tx,
          );
        }),
      );

      const columns = await Promise.all(
        data.map(async ({ columnId, position }) => {
          return await this.columnRepo.update(
            { position },
            workspaceId,
            projectId,
            columnId,
            actorId,
            tx,
          );
        }),
      );

      await this.activityService.logActivity(
        workspaceId,
        ActivityAction.UPDATE_COLUMN,
        'columns',
        actorId,
        undefined,
        {
          new_columns: [
            columns.map((c) => ({
              id: c.id,
              name: c.name,
              position: c.position,
            })),
          ],
        },
        tx,
      );

      return columns;
    });

    return result;
  };

  remove = async (workspaceId: string, projectId: string, columnId: string, actorId: string) => {
    return this.prisma.$transaction(async (tx) => {
      const column = await this.columnRepo.remove(workspaceId, projectId, columnId, actorId, tx);

      await this.activityService.logActivity(
        workspaceId,
        ActivityAction.DELETE_COLUMN,
        'column',
        actorId,
        column.id,
        {
          name: column.name,
          position: column.position,
        },
        tx,
      );

      return column;
    });
  };
}
