import type { Request, Response } from 'express';
import { paginationMetaSchema, paginationQuerySchema, type PaginationQueryType, type WorkspaceParamsType } from '../../common/schemas/common.schemas.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import {
  safeColumnSchema,
  safeColumnsSchema,
  type CreateBodyType,
  type ReOrderBodyType,
  type SafeColumnsType,
  type SafeColumnType,
  type UpdateBodyType,
} from './column.schemas.js';
import type { ColumnService } from './column.service.js';
import {
  created,
  createdEnvelopeSchema,
  ok,
  okEnvelopeSchema,
} from '../../common/utils/response/format.js';
import { validateResponse } from '../../common/utils/response/validate.js';

export class ColumnController {
  constructor(readonly columnService: ColumnService) { }

  create = async (req: Request<WorkspaceParamsType, {}, CreateBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      ActorId: req.user!.id,
    };

    const column = await this.columnService.create(req.body, ctx);

    const safeColumn: SafeColumnType = {
      id: column.id,
      projectId: column.projectId,
      name: column.name,
      position: column.position,
      type: column.type,
      createdAt: column.createdAt,
    };

    const envelope = created(safeColumn);
    const envelopeSchema = createdEnvelopeSchema(safeColumnSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(201).json(validatedEnvelope);
  };

  listByProject = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const paginationQuery: PaginationQueryType = paginationQuerySchema.parse(req.query);
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      ActorId: req.user!.id,
    };

    const { columns, paginationMeta } = await this.columnService.listByProjectId(ctx, paginationQuery);

    const safeColumns: SafeColumnsType = {
      data: columns.map((c) => ({
        id: c.id,
        projectId: c.projectId,
        name: c.name,
        position: c.position,
        type: c.type,
        createdAt: c.createdAt,
      })),
      paginationMeta
    };

    const envelope = ok(safeColumns);
    const envelopeSchema = okEnvelopeSchema(safeColumnsSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  get = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      ActorId: req.user!.id,
    };

    const column = await this.columnService.get(ctx);

    const safeColumn: SafeColumnType = {
      id: column.id,
      projectId: column.projectId,
      name: column.name,
      position: column.position,
      type: column.type,
      createdAt: column.createdAt,
    };

    const envelope = ok(safeColumn);
    const envelopeSchema = okEnvelopeSchema(safeColumnSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  update = async (req: Request<WorkspaceParamsType, {}, UpdateBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      ActorId: req.user!.id,
    };

    const column = await this.columnService.update(req.body, ctx);

    const safeColumn: SafeColumnType = {
      id: column.id,
      projectId: column.projectId,
      name: column.name,
      position: column.position,
      type: column.type,
      createdAt: column.createdAt,
    };

    const envelope = ok(safeColumn);
    const envelopeSchema = okEnvelopeSchema(safeColumnSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  reOrder = async (req: Request<WorkspaceParamsType, {}, ReOrderBodyType, {}, {}>, res: Response) => {
    const paginationQuery: PaginationQueryType = paginationQuerySchema.parse(req.query);
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      ActorId: req.user!.id,
    };

    const { columns, paginationMeta } = await this.columnService.reOrder(req.body, ctx, paginationQuery);

    const safeColumns: SafeColumnsType = {
      data: columns.map((c) => ({
        id: c.id,
        projectId: c.projectId,
        name: c.name,
        position: c.position,
        type: c.type,
        createdAt: c.createdAt,
      })),
      paginationMeta
    };

    const envelope = ok(safeColumns);
    const envelopeSchema = okEnvelopeSchema(safeColumnsSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  remove = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      ActorId: req.user!.id,
    };

    const column = await this.columnService.remove(ctx);

    const safeColumn: SafeColumnType = {
      id: column.id,
      projectId: column.projectId,
      name: column.name,
      position: column.position,
      type: column.type,
      createdAt: column.createdAt,
    };

    const envelope = ok(safeColumn);
    const envelopeSchema = okEnvelopeSchema(safeColumnSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };
}
