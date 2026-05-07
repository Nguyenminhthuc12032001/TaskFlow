import { http } from "../../app/shared/lib/http-interceptors"; 
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../../../api/src/common/utils/response/format";
import { validate } from "../../app/shared/lib/validate"
import {
    acceptBodySchema,
    acceptResponseSchema,
    createBodySchema,
    createResponseSchema,
    getByIdResponseSchema,
    getByUserIdResponseSchema,
    inviteBodySchema,
    inviteCandidatesResponseSchema,
    inviteResponseSchema,
    listInviteeCandidatesQuerySchema,
    listMemberByWorkspaceQuerySchema,
    listWorkspaceQuerySchema,
    membersResponseSchema,
    safeMemberResponseSchema,
    updateBodySchema,
    updateResponseSchema,
    type CreateWorkspaceBody,
    type ListInviteeCandidatesQuery,
    type ListMemberByWorkspaceQuery,
    type ListWorkspaceQuery,
} from "../../../../api/src/modules/workspace/workspace.schemas";
import { workspaceParamsSchema, type WorkspaceParamsType } from "../../../../api/src/common/schemas/common.schemas";

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

        const validatedQuery: ListWorkspaceQuery = validate(listWorkspaceQuerySchema)(query);

        const response = await http.get('/workspaces', 
            { params: validatedQuery }
        );

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(getByUserIdResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    getById: async (id: unknown) => {
        const validatedId = validate(workspaceParamsSchema)({workspaceId: id});
        const response = await http.get(`/workspaces/${validatedId.workspaceId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(getByIdResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    update: async (id: unknown, data: unknown) => {
        const validatedData = validate(updateBodySchema)(data);
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: id });

        const response = await http.patch(`/workspaces/${validatedId.workspaceId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(updateResponseSchema);
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

    listMember: async (id: unknown, query: unknown) => {
        const validatedId: WorkspaceParamsType = validate(workspaceParamsSchema)({ workspaceId: id });
        const validatedQuery: ListMemberByWorkspaceQuery = validate(listMemberByWorkspaceQuerySchema)(query);

        const response = await http.get(`/workspaces/members/${validatedId.workspaceId}`, 
            { params: validatedQuery }
        );

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(membersResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    getMyMembership: async (id: unknown) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: id });

        const response = await http.get(`/workspaces/membership/${validatedId.workspaceId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeMemberResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listInviteCandidates: async (id: unknown, query: unknown = {}) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: id });
        const validatedQuery: ListInviteeCandidatesQuery = validate(listInviteeCandidatesQuerySchema)(query);

        const response = await http.get(`/workspaces/invitees/${validatedId.workspaceId}`,
            { params: validatedQuery }
        );

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(inviteCandidatesResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    invite: async (id: unknown, data: unknown) => {
        const validatedId = validate(workspaceParamsSchema)({ workspaceId: id });
        const validatedData = validate(inviteBodySchema)(data);

        const response = await http.post(`/workspaces/invite/${validatedId.workspaceId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(inviteResponseSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    accept: async (data: unknown) => {
        const validatedData = validate(acceptBodySchema)(data);

        const response = await http.post('/workspaces/accept_invite', validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(acceptResponseSchema);
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
