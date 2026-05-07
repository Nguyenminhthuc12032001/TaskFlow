import { registry } from '../../docs/openapi.js';
import z from '../../docs/zod.js';
import { defaultResponse } from '../workspace/workspace.openApi.js';
import { createBodySchema, createFollowUpTaskBodySchema, listLeadByActorQuerySchema, listLeadsQuerySchema, safeLeadDetailSchema, safeLeadSchema, safeLeadsSchema, safeLeadTaskLinkSchema, updateBodySchema, updateStageBodySchema, } from './lead.schemas.js';
const defaultPath = '/api/leads/{workspaceId}';
const defaultParams = z.object({
    workspaceId: z.uuid(),
});
const withLeadId = defaultParams.extend({
    leadId: z.uuid(),
});
registry.registerPath({
    method: 'get',
    path: '/api/leads',
    tags: ['Lead'],
    summary: 'List leads across actor workspaces',
    security: [{ bearerAuth: [] }],
    request: {
        query: listLeadByActorQuerySchema,
    },
    responses: defaultResponse(safeLeadsSchema, [201, 409]),
});
registry.registerPath({
    method: 'post',
    path: defaultPath,
    tags: ['Lead'],
    summary: 'Create new lead',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: createBodySchema } },
            required: true,
        },
        params: defaultParams,
    },
    responses: defaultResponse(safeLeadSchema, [200]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath + '/{leadId}',
    tags: ['Lead'],
    summary: 'Get by lead Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: withLeadId,
    },
    responses: defaultResponse(safeLeadDetailSchema, [201, 409]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath,
    tags: ['Lead'],
    summary: 'List by workspace',
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams,
        query: listLeadsQuerySchema
    },
    responses: defaultResponse(safeLeadsSchema, [201, 409]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/{leadId}',
    tags: ['Lead'],
    summary: 'Update by Id',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: updateBodySchema } },
        },
        params: withLeadId,
    },
    responses: defaultResponse(safeLeadSchema, [201]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/{leadId}/updateStage',
    tags: ['Lead'],
    summary: 'Update lead stage',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: updateStageBodySchema } },
        },
        params: withLeadId,
    },
    responses: defaultResponse(safeLeadSchema, [201]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/{leadId}/{taskId}/linkTask',
    tags: ['Lead'],
    summary: 'Link task',
    security: [{ bearerAuth: [] }],
    request: {
        params: withLeadId.extend({
            taskId: z.uuid(),
        }),
    },
    responses: defaultResponse(safeLeadTaskLinkSchema, [200]),
});
registry.registerPath({
    method: 'delete',
    path: defaultPath + '/{leadId}/{taskId}/unlinkTask',
    tags: ['Lead'],
    summary: 'Unlink task',
    security: [{ bearerAuth: [] }],
    request: {
        params: withLeadId.extend({
            taskId: z.uuid(),
        }),
    },
    responses: defaultResponse(safeLeadSchema, [201, 409]),
});
registry.registerPath({
    method: 'post',
    path: defaultPath + '/{projectId}/{columnId}/{leadId}',
    tags: ['Lead'],
    summary: 'Create follow up task',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: createFollowUpTaskBodySchema } },
        },
        params: withLeadId.extend({
            columnId: z.uuid(),
            projectId: z.uuid(),
        }),
    },
    responses: defaultResponse(safeLeadTaskLinkSchema, [200]),
});
registry.registerPath({
    method: 'delete',
    path: defaultPath + '/{leadId}',
    tags: ['Lead'],
    summary: 'Delete by Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: withLeadId,
    },
    responses: defaultResponse(safeLeadTaskLinkSchema, [201, 409]),
});
