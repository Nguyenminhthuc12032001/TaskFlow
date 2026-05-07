import { registry } from '../../docs/openapi.js';
import { acceptBodySchema, acceptResponseSchema, createBodySchema, createResponseSchema, deleteResponseSchema, getByIdResponseSchema, getByUserIdResponseSchema, inviteCandidatesResponseSchema, inviteBodySchema, inviteResponseSchema, membersResponseSchema, removeMemberResponseSchema, updateBodySchema, updateResponseSchema, listWorkspaceQuerySchema, listMemberByWorkspaceQuerySchema, } from './workspace.schemas.js';
import { created201, fail400, fail401, fail403, fail404, fail409, fail500, ok200, } from '../auth/auth.openApi.js';
import z from '../../docs/zod.js';
export const defaultResponse = (schema, exclude = []) => {
    const responses = {
        200: ok200(schema),
        201: created201(schema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        409: fail409,
        500: fail500,
    };
    for (const code of exclude) {
        delete responses[code];
    }
    return responses;
};
const defaultPath = '/api/workspaces';
registry.registerPath({
    method: 'post',
    path: defaultPath,
    tags: ['Workspace'],
    summary: 'Create new Workspace',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: createBodySchema } },
        },
    },
    responses: defaultResponse(createResponseSchema, [200, 403, 404]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath,
    tags: ['Workspace'],
    summary: 'Get list workspace by user ID',
    security: [{ bearerAuth: [] }],
    request: {
        query: listWorkspaceQuerySchema,
    },
    responses: defaultResponse(getByUserIdResponseSchema, [201, 404, 409]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath + '/{workspaceId}',
    tags: ['Workspace'],
    summary: 'Get workspace by ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
        }),
    },
    responses: defaultResponse(getByIdResponseSchema, [201, 409]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath + '/members/{workspaceId}',
    tags: ['Workspace'],
    summary: 'Get members by workspace ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
        }),
        query: listMemberByWorkspaceQuerySchema
    },
    responses: defaultResponse(membersResponseSchema, [201, 409]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath + '/membership/{workspaceId}',
    tags: ['Workspace'],
    summary: 'Get member by workspace ID and User ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
        }),
    },
    responses: defaultResponse(membersResponseSchema, [201, 409]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath + '/invitees/{workspaceId}',
    tags: ['Workspace'],
    summary: 'Get users eligible to be invited to workspace',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
        }),
        query: listMemberByWorkspaceQuerySchema,
    },
    responses: defaultResponse(inviteCandidatesResponseSchema, [201, 409]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/{workspaceId}',
    tags: ['Workspace'],
    summary: 'Update workspace name',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: updateBodySchema } },
        },
        params: z.object({
            workspaceId: z.uuid(),
        }),
    },
    responses: defaultResponse(updateResponseSchema, [201]),
});
registry.registerPath({
    method: 'delete',
    path: defaultPath + '/{workspaceId}',
    tags: ['Workspace'],
    summary: 'Delete workspace by ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
        }),
    },
    responses: defaultResponse(deleteResponseSchema, [201, 409]),
});
registry.registerPath({
    method: 'post',
    path: defaultPath + '/invite/{workspaceId}',
    tags: ['Workspace'],
    summary: 'Invite member for workspace',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: inviteBodySchema } },
        },
        params: z.object({
            workspaceId: z.uuid(),
        }),
    },
    responses: defaultResponse(inviteResponseSchema, [201]),
});
registry.registerPath({
    method: 'post',
    path: defaultPath + '/accept_invite',
    tags: ['Workspace'],
    summary: 'Accept invite',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: acceptBodySchema } },
        },
    },
    responses: defaultResponse(acceptResponseSchema, [200]),
});
registry.registerPath({
    method: 'delete',
    path: defaultPath + '/remove_member/{workspaceId}/{memberId}',
    tags: ['Workspace'],
    summary: 'Remove member',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
            memberId: z.uuid(),
        }),
    },
    responses: defaultResponse(removeMemberResponseSchema, [201, 409]),
});
