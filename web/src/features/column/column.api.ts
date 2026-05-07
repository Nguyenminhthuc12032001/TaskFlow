import { paginationQuerySchema, workspaceParamsSchema, type PaginationQueryType } from "../../../../api/src/common/schemas/common.schemas";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../../../api/src/common/utils/response/format";
import {
    createBodySchema,
    listColumnQuerySchema,
    reOrderBodySchema,
    safeColumnSchema,
    safeColumnsSchema,
    updateBodySchema,
    type ListColumnQueryType,
} from "../../../../api/src/modules/column/column.schemas";
import { http } from "../../app/shared/lib/http-interceptors";
import { validate } from "../../app/shared/lib/validate";

export const columnApi = {
    create: async (workspaceId: unknown, projectId: unknown, data: unknown) => {
        const validatedData = validate(createBodySchema)(data);
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: workspaceId, projectId: projectId }); 

        const response = await http.post(`/columns/${validatedId.workspaceId}/${validatedId.projectId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeColumnSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    getById: async (workspaceId: unknown, projectId: unknown, columnId: unknown) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: workspaceId, projectId: projectId, columnId: columnId }); 

        const response = await http.get(`/columns/${validatedId.workspaceId}/${validatedId.projectId}/${validatedId.columnId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeColumnSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listByProject: async (workspaceId: unknown, projectId: unknown, query: unknown = {}) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: workspaceId, projectId: projectId }); 
        const validatedQuery: ListColumnQueryType = validate(listColumnQuerySchema)(query);

        const response = await http.get(`/columns/${validatedId.workspaceId}/${validatedId.projectId}`, { params: validatedQuery });

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeColumnsSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    update: async (workspaceId: unknown, projectId: unknown, columnId: unknown, data: unknown) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: workspaceId, projectId: projectId, columnId: columnId }); 
        const validatedData = validate(updateBodySchema)(data);

        const response = await http.patch(`/columns/${validatedId.workspaceId}/${validatedId.projectId}/${validatedId.columnId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeColumnSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    reOrder: async (workspaceId: unknown, projectId: unknown, data: unknown, query: unknown = {}) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: workspaceId, projectId: projectId }); 
        const validatedData = validate(reOrderBodySchema)(data);
        const validatedQuery: PaginationQueryType = validate(paginationQuerySchema)(query);

        const response = await http.patch(`/columns/${validatedId.workspaceId}/${validatedId.projectId}/re_order`, validatedData, { params: validatedQuery });

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeColumnsSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },
    
    delete: async (workspaceId: unknown, projectId: unknown, columnId: unknown) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: workspaceId, projectId: projectId, columnId: columnId }); 

        const response = await http.delete(`/columns/${validatedId.workspaceId}/${validatedId.projectId}/${validatedId.columnId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeColumnSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },
}
