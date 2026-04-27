import { workspaceParamsSchema } from "../../../../api/src/common/schemas/common.schemas";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../../../api/src/common/utils/response/format";
import { createBodySchema, createFollowUpTaskBodySchema, safeLeadSchema, safeLeadsSchema, safeLeadTaskLinkSchema, updateBodySchema, updateStageBodySchema } from "../../../../api/src/modules/lead/lead.schemas";
import { http } from "../../app/shared/lib/http-interceptors";
import { validate } from "../../app/shared/lib/validate";

export const leadApi = {
    create: async (workspaceId: unknown, data: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)({ workspaceId: workspaceId });

        const validatedData = validate(createBodySchema)(data);

        const response = await http.post(`/leads/${validatedIds.workspaceId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeLeadSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listByWorkspace: async (workspaceId: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)({ workspaceId: workspaceId });

        const response = await http.get(`/leads/${validatedIds.workspaceId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadsSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    getById: async (ctx: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)(ctx);

        const response = await http.get(`/leads/${validatedIds.workspaceId}/${validatedIds.leadId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    update: async (ctx: unknown, data: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)(ctx);

        const validatedData = validate(updateBodySchema)(data);

        const response = await http.patch(`/leads/${validatedIds.workspaceId}/${validatedIds.leadId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    delete: async (ctx: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)(ctx);

        const response = await http.delete(`/leads/${validatedIds.workspaceId}/${validatedIds.leadId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    updateLeadStage: async (ctx: unknown, data: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)(ctx);

        const validatedData = validate(updateStageBodySchema)(data);

        const response = await http.patch(`/leads/${validatedIds.workspaceId}/${validatedIds.leadId}/updateStage`, validatedData);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    linkTask: async (ctx: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)(ctx);

        const response = await http.post(`/leads/${validatedIds.workspaceId}/${validatedIds.leadId}/${validatedIds.taskId}/linkTask`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadTaskLinkSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    unlinkTask: async (ctx: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)(ctx);

        const response = await http.delete(`/leads/${validatedIds.workspaceId}/${validatedIds.leadId}/${validatedIds.taskId}/unlinkTask`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadTaskLinkSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    createFollowUpTask: async (ctx: unknown, data: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)(ctx);

        const validatedData = validate(createFollowUpTaskBodySchema)(data);

        const response = await http.post(`/leads/${validatedIds.workspaceId}/${validatedIds.projectId}/${validatedIds.columnId}/${validatedIds.leadId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeLeadTaskLinkSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    }
}