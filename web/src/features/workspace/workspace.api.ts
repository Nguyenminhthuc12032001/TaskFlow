import { http } from "../../app/shared/lib/http-interceptors";
import { paginationQuerySchema, type PaginationQueryType } from "../../app/shared/lib/schemas/request.schema";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../app/shared/lib/schemas/response.schemas";
import { validate } from "../../app/shared/lib/validate"
import { acceptBodySchema, createBodySchema, createResponseSchema, getByIdResponseSchema, getByUserIdResponseSchema, inviteBodySchema, updateBodySchema, updateResponseSchema, type CreateWorkspaceBody } from "./workspace.schema"

export const workspaceApi = {
    create: async (data: unknown) => {
        const validatedData: CreateWorkspaceBody = validate(createBodySchema)(data);

        const response = await http.post('/workspaces', validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(createResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listByUser: async (query: unknown) => {

        const validatedQuery: PaginationQueryType = validate(paginationQuerySchema)(query);

        const response = await http.get('/workspaces', 
            { params: validatedQuery }
        );

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(getByUserIdResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    getById: async (id: string) => {
        const response = await http.get(`/workspaces/${id}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(getByIdResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    update: async (id: string, data: unknown) => {
        const validatedData = validate(updateBodySchema)(data);

        const response = await http.patch(`/workspaces/${id}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(updateResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    delete: async (id: string) => {
        const response = await http.delete(`/workspaces/${id}`);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(updateResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listMember: async (id: string, query: unknown) => {
        const validatedQuery: PaginationQueryType = validate(paginationQuerySchema)(query);

        const response = await http.get(`/workspaces/members/${id}`, 
            { params: validatedQuery }
        );

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(getByUserIdResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    invite: async (id: string, data: unknown) => {
        const validatedData = validate(inviteBodySchema)(data);

        const response = await http.post(`/workspaces/invite/${id}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(updateResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    accept: async (data: unknown) => {
        const validatedData = validate(acceptBodySchema)(data);

        const response = await http.post('/workspaces/accept', validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(updateResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    deleteMember: async (id: string, memberId: string) => {
        const response = await http.delete(`/workspaces/remove_member/${id}/${memberId}`);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(updateResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    }
}