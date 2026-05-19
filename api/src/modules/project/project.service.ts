import {
  ActivityAction,
  ColumnType,
  type Prisma,
  type Project,
} from '../../../prisma/generated/client.js';
import type { ProjectUpdateInput } from '../../../prisma/generated/models.js';
import { AppError } from '../../common/errors/AppError.js';
import type { PaginationMetaType } from '../../common/schemas/common.schemas.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import { buildDateRange } from '../../common/utils/dateRange.js';
import { buildPagination, buildPaginationMeta } from '../../common/utils/pagination.js';
import type { DbClient } from '../../db/prisma.js';
import type { ActivityService } from '../activity/activity.service.js';

import { ProjectRepo } from './project.repo.js';
import type { CreateBodyType, ListProjectsQueryType, UpdateBodyType } from './project.schemas.js';

export class ProjectService {
  constructor(
    readonly prisma: DbClient,
    readonly projectRepo: ProjectRepo,

    readonly activityService: ActivityService,
  ) {}

  async create(data: CreateBodyType, ctx: ResourceContext): Promise<Project> {
    const projects = await this.projectRepo.allProjectsByWorkspace(ctx);

    if (projects.some((p) => p.name === data.name)) {
      throw new AppError('Duplicate name is not allowed', 409, 'DUPLICATE_NAME');
    }

    const createData: Prisma.ProjectCreateInput = {
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

      await this.activityService.logActivity(
        project.workspaceId,
        ActivityAction.CREATE_PROJECT,
        'project',
        ctx.ActorId,
        project.id,
        { name: project.name },
        tx,
      );

      return project;
    });
  }

  async get(ctx: ResourceContext): Promise<Project> {
    const result = await this.projectRepo.get(ctx);
    if (!result) {
      throw new AppError('Project not found', 404);
    }

    return result;
  }

  async listByWorkspace(
    ctx: ResourceContext,
    paginationQuery: ListProjectsQueryType,
  ): Promise<{ projects: Project[]; paginationMeta: PaginationMetaType }> {
    const { safePage, safeLimit, take, skip } = buildPagination(
      paginationQuery.page,
      paginationQuery.limit,
    );

    const dateRange = buildDateRange({
      startDate: paginationQuery.startDate,
      endDate: paginationQuery.endDate,
    });

    const countProjectsByWorkspace = await this.projectRepo.countProjectsByWorkspace(
      ctx,
      paginationQuery.search,
      dateRange,
    );

    const paginationMeta = buildPaginationMeta(safePage, safeLimit, countProjectsByWorkspace);

    const projects = await this.projectRepo.listByWorkspace(
      ctx,
      paginationQuery.search,
      dateRange,
      { take, skip },
    );

    return { projects, paginationMeta };
  }

  async listByUser(actorId: string): Promise<Project[]> {
    return await this.projectRepo.listByUser(actorId);
  }

  async update(data: UpdateBodyType, ctx: ResourceContext): Promise<Project> {
    const projects = await this.projectRepo.allProjectsByWorkspace(ctx);

    if (
      projects.some(
        (p) => p.name.toLowerCase() === data.name.toLocaleLowerCase() && p.id !== ctx.projectId,
      )
    ) {
      throw new AppError('Duplicate name is not allowed', 409, 'DUPLICATE_NAME');
    }

    const updateData: ProjectUpdateInput = {
      name: data.name,
      description: data.description,
    };

    return await this.prisma.$transaction(async (tx) => {
      const project = await this.projectRepo.update(updateData, ctx, tx);

      await this.activityService.logActivity(
        project.workspaceId,
        ActivityAction.UPDATE_PROJECT,
        'project',
        ctx.ActorId,
        project.id,
        { name: project.name },
        tx,
      );

      return project;
    });
  }

  async remove(ctx: ResourceContext): Promise<Project> {
    return await this.prisma.$transaction(async (tx) => {
      const project = await this.projectRepo.remove(ctx, tx);

      await this.activityService.logActivity(
        project.workspaceId,
        ActivityAction.DELETE_PROJECT,
        'project',
        ctx.ActorId,
        project.id,
        { name: project.name },
        tx,
      );

      return project;
    });
  }
}
