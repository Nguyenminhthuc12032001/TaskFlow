import { paginationQuerySchema, workspaceParamsSchema, type PaginationQueryType } from "../../../../api/src/common/schemas/common.schemas";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../../../api/src/common/utils/response/format";
import {
    assignBodySchema,
    bulkRemoveBodySchema,
    createBodySchema,
    listTaskByColumnQuerySchema,
    reOrderBodySchema,
    safeAssigneeSchema,
    safeTaskDetailSchema,
    safeTaskSchema,
    safeTasksSchema,
    updateBodySchema,
    type ListTaskByColumnQueryType,
} from "../../../../api/src/modules/task/task.schemas";
import { http } from "../../app/shared/lib/http-interceptors";
import { validate } from "../../app/shared/lib/validate";

export const taskApi = {
    create: async (ctx: unknown, data: unknown) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);
        const validatedData = validate(createBodySchema)(data);

        const response = await http.post(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeTaskSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listByColumn: async (ctx: unknown, query: unknown = {}) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);
        const validatedQuery: ListTaskByColumnQueryType = validate(listTaskByColumnQuerySchema)(query);

        const response = await http.get(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}`, { params: validatedQuery });

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeTasksSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    getById: async (ctx: unknown) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);
        const response = await http.get(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}/${validatedParams.taskId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeTaskDetailSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    update: async (ctx: unknown, data: unknown) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);
        const validatedData = validate(updateBodySchema)(data);

        const response = await http.patch(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}/${validatedParams.taskId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeTaskSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    delete: async (ctx: unknown) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);

        const response = await http.delete(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}/${validatedParams.taskId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeTaskSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    bulkDelete: async (ctx: unknown, data: unknown) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);
        const validatedTaskIds = validate(bulkRemoveBodySchema)(data);

        const response = await http.delete(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}/bulk`, { data: validatedTaskIds });

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeTasksSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    reOrder: async (ctx: unknown, data: unknown, query: unknown = {}) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);
        const validatedData = validate(reOrderBodySchema)(data);
        const validatedQuery: PaginationQueryType = validate(paginationQuerySchema)(query);

        const response = await http.patch(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}`, validatedData, { params: validatedQuery });

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeTasksSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    assign: async (ctx: unknown, data: unknown) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);
        const validatedData = validate(assignBodySchema)(data);

        const response = await http.post(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}/${validatedParams.taskId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeAssigneeSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data; 
    },

    archiv: async (ctx: unknown) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);

        const response = await http.patch(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}/${validatedParams.taskId}/archiv`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeTaskSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data; 
    },

    reStore: async (ctx: unknown) => {
        const validatedParams = validate(workspaceParamsSchema)(ctx);

        const response = await http.patch(`/tasks/${validatedParams.workspaceId}/${validatedParams.projectId}/${validatedParams.columnId}/${validatedParams.taskId}/restore`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeTaskSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    }
}
