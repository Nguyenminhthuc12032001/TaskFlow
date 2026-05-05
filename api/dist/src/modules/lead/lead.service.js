import { ActivityAction } from '../../../prisma/generated/client.js';
import { AppError } from '../../common/errors/AppError.js';
import { buildPagination, buildPaginationMeta } from '../../common/utils/pagination.js';
export class LeadService {
    constructor(prisma, leadRepo, taskRepo, activityService) {
        this.prisma = prisma;
        this.leadRepo = leadRepo;
        this.taskRepo = taskRepo;
        this.activityService = activityService;
    }
    async create(data, ctx) {
        if (data.email && (await this.leadRepo.existEmail(data.email, ctx))) {
            throw new AppError('Duplicate email is not allowed', 409);
        }
        if (data.phone && (await this.leadRepo.existPhone(data.phone, ctx))) {
            throw new AppError('Duplicate phone is not allowed', 409);
        }
        const dataCreate = {
            name: data.name,
            ...(data.email !== undefined && { email: data.email }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.source !== undefined && { source: data.source }),
            ...(data.stage !== undefined && { stage: data.stage }),
            note: data.note,
            workspace: { connect: { id: ctx.workspaceId } },
            creator: { connect: { id: ctx.ActorId } },
        };
        return await this.prisma.$transaction(async (tx) => {
            const lead = await this.leadRepo.create(dataCreate, tx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.CREATE_LEAD, 'lead', ctx.ActorId, lead.id, { lead }, tx);
            return lead;
        });
    }
    async get(ctx) {
        const lead = await this.leadRepo.get(ctx);
        if (!lead) {
            throw new AppError('Lead not found', 404);
        }
        return lead;
    }
    async listByWorkspace(ctx, paginationQuery) {
        const { safePage, safeLimit, skip, take } = buildPagination(paginationQuery.page, paginationQuery.limit);
        const countLeads = await this.leadRepo.countLeadsByWorkspace(ctx);
        const paginationMeta = buildPaginationMeta(safePage, safeLimit, countLeads);
        const leads = await this.leadRepo.listByWorkspace(ctx, { skip, take });
        return { leads, paginationMeta };
    }
    async listByActorWorkspaces(actorId, paginationQuery) {
        const { safePage, safeLimit, skip, take } = buildPagination(paginationQuery.page, paginationQuery.limit);
        const countLeads = await this.leadRepo.countLeadsByActorWorkspaces(actorId);
        const paginationMeta = buildPaginationMeta(safePage, safeLimit, countLeads);
        const leads = await this.leadRepo.listByActorWorkspaces(actorId, { skip, take });
        return { leads, paginationMeta };
    }
    async update(data, ctx) {
        if (data.email) {
            const duplicateEmail = await this.leadRepo.existEmail(data.email, ctx);
            if (duplicateEmail && duplicateEmail.id !== ctx.LeadId) {
                throw new AppError('Duplicate email is not allowed', 409);
            }
        }
        if (data.phone) {
            const duplicatePhone = await this.leadRepo.existPhone(data.phone, ctx);
            if (duplicatePhone && duplicatePhone.id !== ctx.LeadId) {
                throw new AppError('Duplicate phone is not allowed', 409);
            }
        }
        const dataUpdate = {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.source !== undefined && { source: data.source }),
            ...(data.note !== undefined && { note: data.note }),
        };
        return await this.prisma.$transaction(async (tx) => {
            const lead = await this.leadRepo.update(dataUpdate, ctx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.UPDATE_LEAD, 'lead', ctx.ActorId, lead.id, { lead }, tx);
            return lead;
        });
    }
    async updateStage(data, ctx) {
        const dataUpdateStage = {
            stage: data.stage,
        };
        return await this.prisma.$transaction(async (tx) => {
            const lead = await this.leadRepo.update(dataUpdateStage, ctx, tx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.UPDATE_LEAD_STAGE, 'lead', ctx.ActorId, lead.id, { lead }, tx);
            return lead;
        });
    }
    async linkTask(ctx) {
        const duplicateLinkTask = await this.leadRepo.existLinkTask(ctx);
        if (duplicateLinkTask) {
            throw new AppError('Duplicate link task is not allowed', 409);
        }
        const dataLinktask = {
            lead: { connect: { id: ctx.LeadId } },
            task: { connect: { id: ctx.TaskId } },
        };
        return await this.prisma.$transaction(async (tx) => {
            const leadTaskLink = await this.leadRepo.linkTask(dataLinktask, tx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.LINK_TASK, 'leadTaskLink', ctx.ActorId, undefined, { leadTaskLink }, tx);
            return leadTaskLink;
        });
    }
    async unlinkTask(ctx) {
        return await this.prisma.$transaction(async (tx) => {
            const leadTaskLink = await this.leadRepo.unlinkTask(ctx, tx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.UNLINK_TASK, 'leadTaskLink', ctx.ActorId, undefined, { leadTaskLink }, tx);
            return leadTaskLink;
        });
    }
    async createFollowUpTask(data, ctx) {
        const tasks = await this.taskRepo.allTasksByColumn(ctx);
        if (data.position) {
            if (tasks.some((t) => t.position === data.position)) {
                throw new AppError('Duplicate task position is not allowed', 409);
            }
        }
        const maxPosition = tasks.length > 0 ? Math.max(...tasks.map((t) => t.position)) : 0;
        data.position = maxPosition + 1000;
        const dataCreateTask = {
            title: data.title,
            ...(data.description !== undefined && { description: data.description }),
            ...(data.priority !== undefined && { priority: data.priority }),
            ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
            ...(data.position !== undefined && { position: data.position }),
            project: { connect: { id: ctx.projectId } },
            column: { connect: { id: ctx.columnId } },
            creator: { connect: { id: ctx.ActorId } },
        };
        return await this.prisma.$transaction(async (tx) => {
            const task = await this.taskRepo.create(dataCreateTask, tx);
            const dataLinktask = {
                lead: { connect: { id: ctx.LeadId } },
                task: { connect: { id: task.id } },
            };
            const leadTaskLink = await this.leadRepo.linkTask(dataLinktask, tx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.CREATE_FOLLOWUP_TASK, 'task', ctx.ActorId, task.id, { task, leadTaskLink }, tx);
            return leadTaskLink;
        });
    }
    async remove(ctx) {
        return await this.prisma.$transaction(async (tx) => {
            const lead = await this.leadRepo.remove(ctx, tx);
            await this.leadRepo.removeLeadTaskLink(ctx, tx);
            await this.activityService.logActivity(ctx.workspaceId, ActivityAction.REMOVE_LEAD, 'lead', ctx.ActorId, lead.id, { lead }, tx);
            return lead;
        });
    }
}
