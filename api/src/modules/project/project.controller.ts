import type { Request, Response } from 'express';
import type { ProjectService } from './project.service.js';
import {
  listProjectsResponseSchema,
  safeProjectResponseSchema,
  type CreateBodyType,
  type ListProjectResponseType,
  type SafeProjectResponseType,
  type UpdateBodyType,
} from './project.schemas.js';
import {
  created,
  createdEnvelopeSchema,
  ok,
  okEnvelopeSchema,
} from '../../common/utils/response/format.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import { validateResponse } from '../../common/utils/response/validate.js';
import { paginationQuerySchema, type PaginationQueryType, type WorkspaceParamsType } from '../../common/schemas/common.schemas.js';

export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  create = async (req: Request<WorkspaceParamsType, {}, CreateBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      ActorId: req.user!.id,
    };

    const project = await this.projectService.create(req.body, ctx);

    const safeProject: SafeProjectResponseType = {
      workspaceId: project.workspaceId,
      id: project.id,
      name: project.name,
      description: project.description ?? '',
      createdAt: project.createdAt,
      createdBy: project.createdBy,
    };

    const envelop = created(safeProject);
    const envelopSchema = createdEnvelopeSchema(safeProjectResponseSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(201).json(validatedEnvelop);
  };

  get = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      ActorId: req.user!.id,
    };

    const project = await this.projectService.get(ctx);

    const safeProject: SafeProjectResponseType = {
      workspaceId: project.workspaceId,
      id: project.id,
      name: project.name,
      description: project.description ?? '',
      createdAt: project.createdAt,
      createdBy: project.createdBy,
    };

    const envelop = ok(safeProject);
    const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };

  listByWorkspace = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const paginationQuery: PaginationQueryType = paginationQuerySchema.parse(req.query);
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      ActorId: req.user!.id,
    };

    const { projects, paginationMeta } = await this.projectService.listByWorkspace(ctx, paginationQuery);

    const safeProjectResponse: ListProjectResponseType = {
      data:
        projects.map((p) => ({
          workspaceId: p.workspaceId,
          id: p.id,
          name: p.name,
          description: p.description ?? '',
          createdAt: p.createdAt,
          createdBy: p.createdBy,
        })),
        paginationMeta
    };

    const envelop = ok(safeProjectResponse);
    const envelopSchema = okEnvelopeSchema(listProjectsResponseSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };

  update = async (req: Request<WorkspaceParamsType, {}, UpdateBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      ActorId: req.user!.id,
    };

    const project = await this.projectService.update(req.body, ctx);

    const safeProjectResponse: SafeProjectResponseType = {
      workspaceId: project.workspaceId,
      id: project.id,
      name: project.name,
      description: project.description ?? '',
      createdAt: project.createdAt,
      createdBy: project.createdBy,
    };

    const envelop = ok(safeProjectResponse);
    const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };

  remove = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      ActorId: req.user!.id,
    };

    const project = await this.projectService.remove(ctx);

    const safeProjectResponse: SafeProjectResponseType = {
      workspaceId: project.workspaceId,
      id: project.id,
      name: project.name,
      description: project.description ?? '',
      createdAt: project.createdAt,
      createdBy: project.createdBy,
    };

    const envelop = ok(safeProjectResponse);
    const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };
}
