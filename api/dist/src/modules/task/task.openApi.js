import { paginationQuerySchema } from '../../common/schemas/common.schemas.js';
import { registry } from '../../docs/openapi.js';
import z from '../../docs/zod.js';
import { defaultResponse } from '../workspace/workspace.openApi.js';
import { assignBodySchema, bulkRemoveBodySchema, createBodySchema, reOrderBodySchema, safeAssigneeSchema, safeTaskSchema, safeTasksSchema, updateBodySchema, } from './task.schemas.js';
const defaultPath = '/api/tasks/{workspaceId}/{projectId}/{columnId}';
const defaultParams = z.object({
    workspaceId: z.uuid(),
    projectId: z.uuid(),
    columnId: z.uuid(),
});
const withTaskId = defaultParams.extend({ taskId: z.uuid() });
registry.registerPath({
    method: 'post',
    path: defaultPath,
    tags: ['Task'],
    summary: 'Create new task',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: createBodySchema } },
            required: true,
        },
        params: defaultParams,
    },
    responses: defaultResponse(safeTaskSchema, [200]),
});
registry.registerPath({
    method: 'post',
    path: defaultPath + '/{taskId}',
    tags: ['Task'],
    summary: 'Assign an assignee',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: assignBodySchema } },
            required: true,
        },
        params: withTaskId,
    },
    responses: defaultResponse(safeAssigneeSchema, [201]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath + '/{taskId}',
    tags: ['Task'],
    summary: 'Get task by Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: withTaskId,
    },
    responses: defaultResponse(safeTaskSchema, [201, 409]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath,
    tags: ['Task'],
    summary: 'List task by column Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams,
        query: paginationQuerySchema
    },
    responses: defaultResponse(safeTasksSchema, [201, 409]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/{taskId}',
    tags: ['Task'],
    summary: 'Update task by Id',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: updateBodySchema } },
            required: true,
        },
        params: withTaskId,
    },
    responses: defaultResponse(safeTaskSchema, [201]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath,
    tags: ['Task'],
    summary: 'ReOrder tasks',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: reOrderBodySchema } },
            required: true,
        },
        params: defaultParams,
        query: paginationQuerySchema
    },
    responses: defaultResponse(safeTasksSchema, [201, 409]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/{taskId}/archiv',
    tags: ['Task'],
    summary: 'Archiv task by Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: withTaskId,
    },
    responses: defaultResponse(safeTaskSchema, [201, 409]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/{taskId}/restore',
    tags: ['Task'],
    summary: 'Restore task by Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: withTaskId,
    },
    responses: defaultResponse(safeTaskSchema, [201, 409]),
});
registry.registerPath({
    method: 'delete',
    path: defaultPath + '/{taskId}',
    tags: ['Task'],
    summary: 'Delete task by Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: withTaskId,
    },
    responses: defaultResponse(safeTaskSchema, [201, 409]),
});
registry.registerPath({
    method: 'delete',
    path: defaultPath,
    tags: ['Task'],
    summary: 'Delete tasks by list Id',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: bulkRemoveBodySchema } },
        },
        params: defaultParams,
    },
    responses: defaultResponse(safeTasksSchema, [201, 409]),
});
