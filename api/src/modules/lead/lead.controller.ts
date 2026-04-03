import type { Request, Response } from 'express';
import { paginationQuerySchema, type PaginationQueryType, type WorkspaceParamsType } from '../../common/schemas/common.schemas.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import type { LeadService } from './lead.service.js';
import {
  safeLeadSchema,
  safeLeadsSchema,
  safeLeadTaskLinkSchema,
  type SafeLeadsType,
  type SafeLeadTaskLinkType,
  type SafeLeadType,
} from './lead.schemas.js';
import {
  created,
  createdEnvelopeSchema,
  ok,
  okEnvelopeSchema,
} from '../../common/utils/response/format.js';
import { validateResponse } from '../../common/utils/response/validate.js';

export class LeadController {
  constructor(readonly leadService: LeadService) { }

  create = async (req: Request<WorkspaceParamsType>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      ActorId: req.user!.id,
    };

    const lead = await this.leadService.create(req.body, ctx);

    const safeLead: SafeLeadType = {
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

  get = async (req: Request<WorkspaceParamsType>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      LeadId: req.params.leadId!,
      ActorId: req.user!.id,
    };

    const lead = await this.leadService.get(ctx);

    const safeLead: SafeLeadType = {
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

  listByWorkspace = async (req: Request<WorkspaceParamsType>, res: Response) => {
    const paginationQuery: PaginationQueryType = paginationQuerySchema.parse(req.query);

    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      ActorId: req.user!.id,
    };

    const { leads, paginationMeta } = await this.leadService.listByWorkspace(ctx, paginationQuery);

    const safeLeads: SafeLeadsType = {
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

  update = async (req: Request<WorkspaceParamsType>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      LeadId: req.params.leadId!,
      ActorId: req.user!.id,
    };

    const lead = await this.leadService.update(req.body, ctx);

    const safeLead: SafeLeadType = {
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

  updateStage = async (req: Request<WorkspaceParamsType>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      LeadId: req.params.leadId!,
      ActorId: req.user!.id,
    };

    const lead = await this.leadService.updateStage(req.body, ctx);

    const safeLead: SafeLeadType = {
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

  linkTask = async (req: Request<WorkspaceParamsType>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      LeadId: req.params.leadId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const leadTaskLink = await this.leadService.linkTask(ctx);

    const safeLeadTaskLink: SafeLeadTaskLinkType = {
      leadId: leadTaskLink.leadId,
      taskId: leadTaskLink.taskId,
    };

    const envelope = created(safeLeadTaskLink);
    const envelopeSchema = createdEnvelopeSchema(safeLeadTaskLinkSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(201).json(validatedEnvelope);
  };

  unlinkTask = async (req: Request<WorkspaceParamsType>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      LeadId: req.params.leadId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const leadTaskLink = await this.leadService.unlinkTask(ctx);

    const safeLeadTaskLink: SafeLeadTaskLinkType = {
      leadId: leadTaskLink.leadId,
      taskId: leadTaskLink.taskId,
    };

    const envelope = ok(safeLeadTaskLink);
    const envelopeSchema = okEnvelopeSchema(safeLeadTaskLinkSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  createFollowUpTask = async (req: Request<WorkspaceParamsType>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      LeadId: req.params.leadId!,
      ActorId: req.user!.id,
    };

    const leadTaskLink = await this.leadService.createFollowUpTask(req.body, ctx);

    const safeLeadTaskLink: SafeLeadTaskLinkType = {
      leadId: leadTaskLink.leadId,
      taskId: leadTaskLink.taskId,
    };

    const envelope = created(safeLeadTaskLink);
    const envelopeSchema = createdEnvelopeSchema(safeLeadTaskLinkSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(201).json(validatedEnvelope);
  };

  remove = async (req: Request<WorkspaceParamsType>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      LeadId: req.params.leadId!,
      ActorId: req.user!.id,
    };

    const lead = await this.leadService.remove(ctx);

    const safeLead: SafeLeadType = {
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
