import { workspaceParamsSchema, type WorkspaceParamsType } from "../../../../api/src/common/schemas/common.schemas";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../../../api/src/common/utils/response/format";
import {
    createBodySchema,
    listProjectsQuerySchema,
    listProjectsResponseSchema,
    safeProjectResponseSchema,
    updateBodySchema,
    type ListProjectsQueryType,
} from "../../../../api/src/modules/project/project.schemas";
import { http } from "../../app/shared/lib/http-interceptors";
import { validate } from "../../app/shared/lib/validate";

export const projectApi = {
    create: async (workspaceId: unknown, data: unknown) => {
        const validatedWorkspaceId = validate(workspaceParamsSchema)({ workspaceId: workspaceId });
        const validatedData = validate(createBodySchema)(data);

        const response = await http.post(`/projects/${validatedWorkspaceId.workspaceId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeProjectResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listByWorkspace: async (workspaceId: unknown, query: unknown) => {
        const validatedWorkspaceId: WorkspaceParamsType = validate(workspaceParamsSchema)({ workspaceId: workspaceId });
        const validatedQuery: ListProjectsQueryType = validate(listProjectsQuerySchema)(query);

        const response = await http.get(`/projects/${validatedWorkspaceId.workspaceId}`, { params: validatedQuery });

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(listProjectsResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    getById: async (workspaceId: unknown, projectId: unknown) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: workspaceId, projectId: projectId }); 

        const response = await http.get(`/projects/${validatedId.workspaceId}/${validatedId.projectId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    update: async (workspaceId: unknown, projectId: unknown, data: unknown) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: workspaceId, projectId: projectId });

        const validatedData = validate(updateBodySchema)(data);

        const response = await http.patch(`/projects/${validatedId.workspaceId}/${validatedId.projectId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    delete: async (workspaceId: unknown, projectId: unknown) => {
        const validatedWorkspaceId = validate(workspaceParamsSchema)({ workspaceId: workspaceId });
        const validatedProjectId = validate(workspaceParamsSchema)({ projectId: projectId });

        const response = await http.delete(`/projects/${validatedWorkspaceId.workspaceId}/${validatedProjectId.projectId}`);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeProjectResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    }
}
