import { Prisma } from "../../../prisma/generated/client.js";
import { AppError } from "../../common/errors/AppError.js";
import type { ResourceContext } from "../../common/types/common.types.js";
import type { DbClient } from "../../db/prisma.js";
import type { TaskRepo } from "../task/task.repo.js";
import type { LeadRepo } from "./lead.repo.js";
import type { CreateBodyType, CreateFollowUpBodyType, UpdateBodyType, UpdateStageBodyType } from "./lead.schemas.js";

export class LeadService {
    constructor(
        readonly prisma: DbClient,
        readonly leadRepo: LeadRepo,
        readonly taskRepo: TaskRepo
    ) { };

    create = async (data: CreateBodyType, ctx: ResourceContext) => {

        if (data.email && await this.leadRepo.existEmail(data.email, ctx)) {
            throw new AppError("Duplicate email is not allowed", 409);
        };

        if (data.phone && await this.leadRepo.existPhone(data.phone, ctx)) {
            throw new AppError("Duplicate phone is not allowed", 409);
        };

        const dataCreate: Prisma.LeadCreateInput = {
            name: data.name,
            ...(data.email !== undefined && { email: data.email }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.source !== undefined && { source: data.source }),
            ...(data.stage !== undefined && { stage: data.stage }),
            note: data.note,
            workspace: { connect: { id: ctx.workspaceId } },
            creator: { connect: { id: ctx.ActorId } }
        };

        const lead = await this.leadRepo.create(dataCreate);

        return lead;
    };

    get = async (ctx: ResourceContext) => {

        const lead = await this.leadRepo.get(ctx);

        if (!lead) {
            throw new AppError("Lead not found", 404);
        };

        return lead;
    };

    listByWorkspace = async (ctx: ResourceContext) => {

        return await this.leadRepo.listByWorkspace(ctx);
    };

    update = async (data: UpdateBodyType, ctx: ResourceContext) => {

        if (data.email) {
            const duplicateEmail = await this.leadRepo.existEmail(data.email, ctx);

            if (duplicateEmail && duplicateEmail.id !== ctx.LeadId) {
                throw new AppError("Duplicate email is not allowed", 409);
            };
        };

        if (data.phone) {
            const duplicatePhone = await this.leadRepo.existPhone(data.phone, ctx);

            if (duplicatePhone && duplicatePhone.id !== ctx.LeadId) {
                throw new AppError("Duplicate phone is not allowed", 409);
            };
        };

        const dataUpdate: Prisma.LeadUpdateInput = {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.source !== undefined && { source: data.source }),
            ...(data.note !== undefined && { note: data.note })
        };

        return await this.leadRepo.update(dataUpdate, ctx);
    }

    updateStage = async (data: UpdateStageBodyType, ctx: ResourceContext) => {

        const dataUpdateStage: Prisma.LeadUpdateInput = {
            stage: data.stage
        };

        return await this.leadRepo.update(dataUpdateStage, ctx);
    };

    linkTask = async (ctx: ResourceContext) => {

        const duplicateLinkTask = await this.leadRepo.existLinkTask(ctx);

        if (duplicateLinkTask) {
            throw new AppError("Duplicate link task is not allowed", 409);
        };

        const dataLinktask: Prisma.LeadTaskLinkCreateInput = {
            lead: { connect: { id: ctx.LeadId } },
            task: { connect: { id: ctx.TaskId } }
        };

        const leadTaskLink = await this.leadRepo.linkTask(dataLinktask);

        return leadTaskLink;
    };

    unlinkTask = async (ctx: ResourceContext) => {
        const leadTaskLink = await this.leadRepo.unlinkTask(ctx);

        return leadTaskLink;
    };

    createFollowUpTask = async (data: CreateFollowUpBodyType, ctx: ResourceContext) => {

        const dataCreateTask: Prisma.TaskCreateInput = {
            title: data.title,
            ...(data.description !== undefined && { description: data.description }),
            ...(data.priority !== undefined && { priority: data.priority }),
            ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
            ...(data.position !== undefined && { position: data.position }),
            project: { connect: { id: ctx.projectId } },
            column: { connect: { id: ctx.columnId } },
            creator: { connect: { id: ctx.ActorId } }
        };

        return await this.prisma.$transaction(async (tx) => {

            const task = await this.taskRepo.create(dataCreateTask);

            const dataLinktask: Prisma.LeadTaskLinkCreateInput = {
                lead: { connect: { id: ctx.LeadId } },
                task: { connect: { id: task.id } }
            };

            const leadTaskLink = await this.leadRepo.linkTask(dataLinktask);

            return leadTaskLink
        });
    };

    remove = async (ctx: ResourceContext) => {

        return await this.prisma.$transaction(async (tx) => {

            const lead = await this.leadRepo.remove(ctx, tx);
            await this.leadRepo.removeLeadTaskLink(ctx, tx);

            return lead;
        });
    };
};