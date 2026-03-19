import type { Request, Response } from "express";
import type { WorkspaceParams } from "../../common/middlewares/requireWorkspaceRole.middleware.js";
import { safeColumnSchema, safeColumnsSchema, type CreateBodyType, type ReOrderBodyType, type SafeColumnsType, type SafeColumnType, type UpdateBodyType } from "./column.schemas.js";
import type { ColumnService } from "./column.service.js";
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from "../../common/utils/response/format.js";
import { validateResponse } from "../../common/utils/response/validate.js";

export class ColumnController {
    constructor(
        readonly columnService: ColumnService
    ) {}

    create = async (req: Request<WorkspaceParams, {}, CreateBodyType, {}, {}>, res: Response) => {

        const column = await this.columnService.create(req.body, req.params.workspaceId, req.params.projectId!, req.user!.id);

        const safeColumn: SafeColumnType = {
            id: column.id,
            projectId: column.projectId,
            name: column.name,
            position: column.position,
            type: column.type,
            createdAt: column.createdAt
        };

        const envelop = created(safeColumn);
        const envelopSchema = createdEnvelopeSchema(safeColumnSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(201).json(validatedEnvelop);
    };

    listByProject = async (req: Request<WorkspaceParams, {}, {}, {}, {}>, res: Response) => {

        const columns = await this.columnService.listByProjectId(req.params.workspaceId, req.params.projectId!, req.user!.id);

        const safeColumns: SafeColumnsType = columns.map((c) => ({
            id: c.id,
            projectId: c.projectId,
            name: c.name,
            position: c.position,
            type: c.type,
            createdAt: c.createdAt
        }));

        const envelop = ok(safeColumns);
        const envelopSchema = okEnvelopeSchema(safeColumnsSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    get = async (req: Request<WorkspaceParams, {}, {}, {}, {}>, res: Response) => {

        const column = await this.columnService.get(req.params.workspaceId, req.params.projectId!, req.params.columnId!, req.user!.id);

        const safeColumn: SafeColumnType = {
            id: column.id,
            projectId: column.projectId,
            name: column.name,
            position: column.position,
            type: column.type,
            createdAt: column.createdAt
        };

        const envelop = ok(safeColumn);
        const envelopSchema = okEnvelopeSchema(safeColumnSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);
        
        return res.status(200).json(validatedEnvelop);
    };

    update = async (req: Request<WorkspaceParams, {}, UpdateBodyType, {}, {}>, res: Response) => {

        const column = await this.columnService.update(req.body, req.params.workspaceId, req.params.projectId!, req.params.columnId!, req.user!.id);

        const safeColumn: SafeColumnType = {
            id: column.id,
            projectId: column.projectId,
            name: column.name,
            position: column.position,
            type: column.type,
            createdAt: column.createdAt
        };

        const envelop = ok(safeColumn);
        const envelopSchema = okEnvelopeSchema(safeColumnSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    reOrder = async (req: Request<WorkspaceParams, {}, ReOrderBodyType, {}, {}>, res: Response) => {

        const columns = await this.columnService.reOrder(req.body, req.params.workspaceId, req.params.projectId!, req.user!.id);

        const safeColumns: SafeColumnsType = columns.map((c) => ({
            id: c.id,
            projectId: c.projectId,
            name: c.name,
            position: c.position,
            type: c.type,
            createdAt: c.createdAt
        }));

        const envelop = ok(safeColumns);
        const envelopSchema = okEnvelopeSchema(safeColumnsSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    remove = async (req: Request<WorkspaceParams, {}, {}, {}, {}>, res: Response) => {

        const column = await this.columnService.remove(req.params.workspaceId, req.params.projectId!, req.params.columnId!, req.user!.id);

        const safeColumn: SafeColumnType = {
            id: column.id,
            projectId: column.projectId,
            name: column.projectId,
            position: column.position,
            type: column.type,
            createdAt: column.createdAt
        };

        const envelop = ok(safeColumn);
        const envelopSchema = okEnvelopeSchema(safeColumnSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };
};