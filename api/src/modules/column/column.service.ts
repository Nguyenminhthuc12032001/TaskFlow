import { ActivityAction, type Prisma } from '../../../prisma/generated/client.js';
import { AppError } from '../../common/errors/AppError.js';
import type { PaginationQueryType } from '../../common/schemas/common.schemas.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import { buildPagination, buildPaginationMeta } from '../../common/utils/pagination.js';
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

  async create(
    data: CreateBodyType,
    ctx: ResourceContext,
  ) {
    const columns = await this.columnRepo.allColumnsByProject(ctx);

    if (columns.length >= 10) {
      throw new AppError('Maximum number of columns reached', 409);
    }

    if (columns.some((c) => c.name.toLowerCase() === data.name.toLowerCase())) {
      throw new AppError('Duplicate name is not allowed', 409);
    }
    
    data.position = Math.max(...columns.map((c) => c.position), -1) + 1;

    const createData: Prisma.ColumnCreateInput = {
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

      await this.activityService.logActivity(
        ctx.workspaceId,
        ActivityAction.CREATE_COLUMN,
        'column',
        ctx.ActorId,
        column.id,
        { name: column.name },
        tx,
      );

      return column;
    });
  }

  async listByProjectId(ctx: ResourceContext, paginationQuery: PaginationQueryType) {
    const { safePage, safeLimit, skip, take } = buildPagination(paginationQuery.page, paginationQuery.limit);

    const countColumns = await this.columnRepo.countColumnsByProject(ctx);

    const paginationMeta = buildPaginationMeta(safePage, safeLimit, countColumns);

    const columns = await this.columnRepo.listByProject(ctx, { skip, take });

    return { columns, paginationMeta };
  }

  async get(ctx: ResourceContext) {
    const column = await this.columnRepo.get(ctx);

    if (!column) {
      throw new AppError(`Column with id: ${ctx.columnId} not found`, 404);
    }

    return column;
  }

  async update(
    data: UpdateBodyType,
    ctx: ResourceContext,
  ) {
    const columns = await this.columnRepo.allColumnsByProject(ctx);

    if (columns.some((c) => c.name === data.name && c.id !== ctx.columnId)) {
      throw new AppError('Duplicate name is not allowed', 409);
    }

    const updateData: Prisma.ColumnUpdateInput = {
      name: data.name,
    };

    return await this.prisma.$transaction(async (tx) => {
      const column = await this.columnRepo.update(updateData, ctx, tx);

      await this.activityService.logActivity(
        ctx.workspaceId,
        ActivityAction.UPDATE_COLUMN,
        'column',
        ctx.ActorId,
        column.id,
        {
          name: column.name,
          position: column.position,
        },
        tx,
      );

      return column;
    });
  }

  async bulkUpdateStatus(data: any, ctx: ResourceContext) {}

  async reOrder(
    data: ReOrderBodyType,
    ctx: ResourceContext,
    paginationQuery: PaginationQueryType
  ) {
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
      await Promise.all(
        data.map(async ({ columnId, position }) => {
          return await this.columnRepo.update({ position: -(position + 1) }, { ...ctx, columnId }, tx);
        }),
      );

      const columns = await Promise.all(
        data.map(async ({ columnId, position }) => {
          return await this.columnRepo.update({ position }, { ...ctx, columnId }, tx);
        }),
      );

      await this.activityService.logActivity(
        ctx.workspaceId,
        ActivityAction.UPDATE_COLUMN,
        'columns',
        ctx.ActorId,
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
    });

    const { safePage, safeLimit, skip, take } = buildPagination(paginationQuery.page, paginationQuery.limit);

    const countColumns = await this.columnRepo.countColumnsByProject(ctx);

    const paginationMeta = buildPaginationMeta(safePage, safeLimit, countColumns);

    const columns = await this.columnRepo.listByProject(ctx, { skip, take });

    return { columns, paginationMeta };
  }

  async remove(ctx: ResourceContext) {
    return this.prisma.$transaction(async (tx) => {
      const column = await this.columnRepo.remove(ctx, tx);

      await this.activityService.logActivity(
        ctx.workspaceId,
        ActivityAction.DELETE_COLUMN,
        'column',
        ctx.ActorId,
        column.id,
        {
          name: column.name,
          position: column.position,
        },
        tx,
      );

      return column;
    });
  }
}
