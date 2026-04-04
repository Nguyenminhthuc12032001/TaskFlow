import { paginationQuerySchema } from '../../common/schemas/common.schemas.js';
import { safeLeadSchema, safeLeadsSchema, safeLeadTaskLinkSchema, } from './lead.schemas.js';
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema, } from '../../common/utils/response/format.js';
import { validateResponse } from '../../common/utils/response/validate.js';
export class LeadController {
    constructor(leadService) {
        this.leadService = leadService;
        this.create = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                ActorId: req.user.id,
            };
            const lead = await this.leadService.create(req.body, ctx);
            const safeLead = {
                id: lead.id,
                workspaceId: lead.workspaceId,
                name: lead.name,
                stage: lead.stage,
                note: lead.note,
                createdBy: lead.createdBy,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt,
                ...(lead.email != null && { email: lead.email }),
                ...(lead.phone != null && { phone: lead.phone }),
                ...(lead.source != null && { source: lead.source }),
            };
            const envelope = created(safeLead);
            const envelopeSchema = createdEnvelopeSchema(safeLeadSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(201).json(validatedEnvelope);
        };
        this.get = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                LeadId: req.params.leadId,
                ActorId: req.user.id,
            };
            const lead = await this.leadService.get(ctx);
            const safeLead = {
                id: lead.id,
                workspaceId: lead.workspaceId,
                name: lead.name,
                stage: lead.stage,
                note: lead.note,
                createdBy: lead.createdBy,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt,
                ...(lead.email != null && { email: lead.email }),
                ...(lead.phone != null && { phone: lead.phone }),
                ...(lead.source != null && { source: lead.source }),
            };
            const envelope = ok(safeLead);
            const envelopeSchema = okEnvelopeSchema(safeLeadSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.listByWorkspace = async (req, res) => {
            const paginationQuery = paginationQuerySchema.parse(req.query);
            const ctx = {
                workspaceId: req.params.workspaceId,
                ActorId: req.user.id,
            };
            const { leads, paginationMeta } = await this.leadService.listByWorkspace(ctx, paginationQuery);
            const safeLeads = {
                data: leads.map((lead) => ({
                    id: lead.id,
                    workspaceId: lead.workspaceId,
                    name: lead.name,
                    stage: lead.stage,
                    note: lead.note,
                    createdBy: lead.createdBy,
                    createdAt: lead.createdAt,
                    updatedAt: lead.updatedAt,
                    ...(lead.email != null && { email: lead.email }),
                    ...(lead.phone != null && { phone: lead.phone }),
                    ...(lead.source != null && { source: lead.source }),
                })),
                paginationMeta,
            };
            const envelope = ok(safeLeads);
            const envelopeSchema = okEnvelopeSchema(safeLeadsSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.update = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                LeadId: req.params.leadId,
                ActorId: req.user.id,
            };
            const lead = await this.leadService.update(req.body, ctx);
            const safeLead = {
                id: lead.id,
                workspaceId: lead.workspaceId,
                name: lead.name,
                stage: lead.stage,
                note: lead.note,
                createdBy: lead.createdBy,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt,
                ...(lead.email != null && { email: lead.email }),
                ...(lead.phone != null && { phone: lead.phone }),
                ...(lead.source != null && { source: lead.source }),
            };
            const envelope = ok(safeLead);
            const envelopeSchema = okEnvelopeSchema(safeLeadSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.updateStage = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                LeadId: req.params.leadId,
                ActorId: req.user.id,
            };
            const lead = await this.leadService.updateStage(req.body, ctx);
            const safeLead = {
                id: lead.id,
                workspaceId: lead.workspaceId,
                name: lead.name,
                stage: lead.stage,
                note: lead.note,
                createdBy: lead.createdBy,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt,
                ...(lead.email != null && { email: lead.email }),
                ...(lead.phone != null && { phone: lead.phone }),
                ...(lead.source != null && { source: lead.source }),
            };
            const envelope = ok(safeLead);
            const envelopeSchema = okEnvelopeSchema(safeLeadSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.linkTask = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                LeadId: req.params.leadId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const leadTaskLink = await this.leadService.linkTask(ctx);
            const safeLeadTaskLink = {
                leadId: leadTaskLink.leadId,
                taskId: leadTaskLink.taskId,
            };
            const envelope = created(safeLeadTaskLink);
            const envelopeSchema = createdEnvelopeSchema(safeLeadTaskLinkSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(201).json(validatedEnvelope);
        };
        this.unlinkTask = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                LeadId: req.params.leadId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const leadTaskLink = await this.leadService.unlinkTask(ctx);
            const safeLeadTaskLink = {
                leadId: leadTaskLink.leadId,
                taskId: leadTaskLink.taskId,
            };
            const envelope = ok(safeLeadTaskLink);
            const envelopeSchema = okEnvelopeSchema(safeLeadTaskLinkSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.createFollowUpTask = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                LeadId: req.params.leadId,
                ActorId: req.user.id,
            };
            const leadTaskLink = await this.leadService.createFollowUpTask(req.body, ctx);
            const safeLeadTaskLink = {
                leadId: leadTaskLink.leadId,
                taskId: leadTaskLink.taskId,
            };
            const envelope = created(safeLeadTaskLink);
            const envelopeSchema = createdEnvelopeSchema(safeLeadTaskLinkSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(201).json(validatedEnvelope);
        };
        this.remove = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                LeadId: req.params.leadId,
                ActorId: req.user.id,
            };
            const lead = await this.leadService.remove(ctx);
            const safeLead = {
                id: lead.id,
                workspaceId: lead.workspaceId,
                name: lead.name,
                stage: lead.stage,
                note: lead.note,
                createdBy: lead.createdBy,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt,
                ...(lead.email != null && { email: lead.email }),
                ...(lead.phone != null && { phone: lead.phone }),
                ...(lead.source != null && { source: lead.source }),
            };
            const envelope = ok(safeLead);
            const envelopeSchema = okEnvelopeSchema(safeLeadSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
    }
}
