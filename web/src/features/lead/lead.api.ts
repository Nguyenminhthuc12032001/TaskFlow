import { paginationQuerySchema, workspaceParamsSchema, type PaginationQueryType, type WorkspaceParamsType } from "../../../../api/src/common/schemas/common.schemas";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../../../api/src/common/utils/response/format";
import { createBodySchema, createFollowUpTaskBodySchema, safeLeadDetailSchema, safeLeadSchema, safeLeadsSchema, safeLeadsWithWorkspaceSchema, safeLeadTaskLinkSchema, updateBodySchema, updateStageBodySchema } from "../../../../api/src/modules/lead/lead.schemas";
import { http } from "../../app/shared/lib/http-interceptors";
import { validate } from "../../app/shared/lib/validate";

export const leadApi = {
    create: async (ctx: unknown, data: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)(ctx);

        const validatedData = validate(createBodySchema)(data);

        const response = await http.post(`/leads/${validatedIds.workspaceId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeLeadSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listByWorkspace: async (workspaceId: unknown, query: unknown) => {
        const validatedIds: WorkspaceParamsType = validate(workspaceParamsSchema)({ workspaceId: workspaceId });
        const validatedQuery: PaginationQueryType = validate(paginationQuerySchema)(query);

        const response = await http.get(`/leads/${validatedIds.workspaceId}`, { params: validatedQuery });

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadsSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listByUserWorkspaces: async (query: unknown) => {
        const validatedQuery: PaginationQueryType = validate(paginationQuerySchema)(query);

        const response = await http.get("/leads", { params: validatedQuery });

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadsWithWorkspaceSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    getById: async (ctx: unknown) => {
        const validatedIds = validate(workspaceParamsSchema)(ctx);

        const response = await http.get(`/leads/${validatedIds.workspaceId}/${validatedIds.leadId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeLeadDetailSchema);
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

        const response = await http.patch(`/leads/${validatedIds.workspaceId}/${validatedIds.leadId}/${validatedIds.taskId}/linkTask`);

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
