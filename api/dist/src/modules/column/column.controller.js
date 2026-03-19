import { safeColumnSchema, safeColumnsSchema } from "./column.schemas.js";
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from "../../common/utils/response/format.js";
import { validateResponse } from "../../common/utils/response/validate.js";
export class ColumnController {
    constructor(columnService) {
        this.columnService = columnService;
        this.create = async (req, res) => {
            const column = await this.columnService.create(req.body, req.params.workspaceId, req.params.projectId, req.user.id);
            const safeColumn = {
                id: column.id,
                projectId: column.projectId,
                name: column.name,
                position: column.position,
                createdAt: column.createdAt
            };
            const envelop = created(safeColumn);
            const envelopSchema = createdEnvelopeSchema(safeColumnSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
        };
        this.listByProject = async (req, res) => {
            const columns = await this.columnService.listByProjectId(req.params.workspaceId, req.params.projectId, req.user.id);
            const safeColumns = columns.map((c) => ({
                id: c.id,
                projectId: c.projectId,
                name: c.name,
                position: c.position,
                createdAt: c.createdAt
            }));
            const envelop = ok(safeColumns);
            const envelopSchema = okEnvelopeSchema(safeColumnsSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.get = async (req, res) => {
            const column = await this.columnService.get(req.params.workspaceId, req.params.projectId, req.params.columnId, req.user.id);
            const safeColumn = {
                id: column.id,
                projectId: column.projectId,
                name: column.name,
                position: column.position,
                createdAt: column.createdAt
            };
            const envelop = ok(safeColumn);
            const envelopSchema = okEnvelopeSchema(safeColumnSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.update = async (req, res) => {
            const column = await this.columnService.update(req.body, req.params.workspaceId, req.params.projectId, req.params.columnId, req.user.id);
            const safeColumn = {
                id: column.id,
                projectId: column.projectId,
                name: column.name,
                position: column.position,
                createdAt: column.createdAt
            };
            const envelop = ok(safeColumn);
            const envelopSchema = okEnvelopeSchema(safeColumnSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.reOrder = async (req, res) => {
            const columns = await this.columnService.reOrder(req.body, req.params.workspaceId, req.params.projectId, req.user.id);
            const safeColumns = columns.map((c) => ({
                id: c.id,
                projectId: c.projectId,
                name: c.name,
                position: c.position,
                createdAt: c.createdAt
            }));
            const envelop = ok(safeColumns);
            const envelopSchema = okEnvelopeSchema(safeColumnsSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.remove = async (req, res) => {
            const column = await this.columnService.remove(req.params.workspaceId, req.params.projectId, req.params.columnId, req.user.id);
            const safeColumn = {
                id: column.id,
                projectId: column.projectId,
                name: column.projectId,
                position: column.position,
                createdAt: column.createdAt
            };
            const envelop = ok(safeColumn);
            const envelopSchema = okEnvelopeSchema(safeColumnSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
    }
}
;
