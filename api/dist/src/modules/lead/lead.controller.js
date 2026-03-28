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
            const envelop = created(safeLead);
            const envelopSchema = createdEnvelopeSchema(safeLeadSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
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
            const envelop = ok(safeLead);
            const envelopSchema = okEnvelopeSchema(safeLeadSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.listByWorkspace = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                ActorId: req.user.id,
            };
            const leads = await this.leadService.listByWorkspace(ctx);
            const safeLeads = leads.map((lead) => ({
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
            }));
            const envelop = ok(safeLeads);
            const envelopSchema = okEnvelopeSchema(safeLeadsSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
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
            const envelop = ok(safeLead);
            const envelopSchema = okEnvelopeSchema(safeLeadSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
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
            const envelop = ok(safeLead);
            const envelopSchema = okEnvelopeSchema(safeLeadSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
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
            const envelop = created(safeLeadTaskLink);
            const envelopSchema = createdEnvelopeSchema(safeLeadTaskLinkSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
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
            const envelop = ok(safeLeadTaskLink);
            const envelopSchema = okEnvelopeSchema(safeLeadTaskLinkSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
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
            const envelop = created(safeLeadTaskLink);
            const envelopSchema = createdEnvelopeSchema(safeLeadTaskLinkSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
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
            const envelop = ok(safeLead);
            const envelopSchema = okEnvelopeSchema(safeLeadSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
    }
}
