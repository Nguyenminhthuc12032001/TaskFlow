import { paginationQuerySchema } from '../../common/schemas/common.schemas.js';
import { safeColumnSchema, safeColumnsSchema, } from './column.schemas.js';
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema, } from '../../common/utils/response/format.js';
import { validateResponse } from '../../common/utils/response/validate.js';
export class ColumnController {
    constructor(columnService) {
        this.columnService = columnService;
        this.create = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                ActorId: req.user.id,
            };
            const column = await this.columnService.create(req.body, ctx);
            const safeColumn = {
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
        this.listByProject = async (req, res) => {
            const paginationQuery = paginationQuerySchema.parse(req.query);
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                ActorId: req.user.id,
            };
            const { columns, paginationMeta } = await this.columnService.listByProjectId(ctx, paginationQuery);
            const safeColumns = {
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
        this.get = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id,
            };
            const column = await this.columnService.get(ctx);
            const safeColumn = {
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
        this.update = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id,
            };
            const column = await this.columnService.update(req.body, ctx);
            const safeColumn = {
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
        this.reOrder = async (req, res) => {
            const paginationQuery = paginationQuerySchema.parse(req.query);
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                ActorId: req.user.id,
            };
            const { columns, paginationMeta } = await this.columnService.reOrder(req.body, ctx, paginationQuery);
            const safeColumns = {
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
        this.remove = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id,
            };
            const column = await this.columnService.remove(ctx);
            const safeColumn = {
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
}
