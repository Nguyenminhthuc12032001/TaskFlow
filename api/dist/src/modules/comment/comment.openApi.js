import { registry } from '../../docs/openapi.js';
import z from '../../docs/zod.js';
import { defaultResponse } from '../workspace/workspace.openApi.js';
import { createBodySchema, listCommentsQuerySchema, safeCommentSchema, safeCommentsSchema, updateBodySchema, } from './comment.schemas.js';
const defaultPath = '/api/comments/{workspaceId}/{projectId}/{columnId}/{taskId}';
const defaultParams = z.object({
    workspaceId: z.uuid(),
    projectId: z.uuid(),
    columnId: z.uuid(),
    taskId: z.uuid(),
});
const withCommentId = defaultParams.extend({ commentId: z.uuid() });
registry.registerPath({
    method: 'post',
    path: defaultPath,
    tags: ['Comment'],
    summary: 'Create new comment',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: createBodySchema } },
            required: true,
        },
        params: defaultParams,
    },
    responses: defaultResponse(safeCommentSchema, [200, 409]),
});
registry.registerPath({
    method: 'post',
    path: defaultPath + '/{commentId}',
    tags: ['Comment'],
    summary: 'Reply to comment',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: createBodySchema } },
            required: true,
        },
        params: withCommentId,
    },
    responses: defaultResponse(safeCommentSchema, [200, 409]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath,
    tags: ['Comment'],
    summary: 'List comments by task',
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams,
        query: listCommentsQuerySchema
    },
    responses: defaultResponse(safeCommentsSchema, [201, 409]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath + '/{commentId}',
    tags: ['Comment'],
    summary: 'Get comment by Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: withCommentId,
    },
    responses: defaultResponse(safeCommentSchema, [201, 409]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/{commentId}',
    tags: ['Comment'],
    summary: 'Update comment by Id',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: updateBodySchema } },
            required: true,
        },
        params: withCommentId,
    },
    responses: defaultResponse(safeCommentSchema, [201, 409]),
});
registry.registerPath({
    method: 'delete',
    path: defaultPath + '/{commentId}',
    tags: ['Comment'],
    summary: 'Delete comment by Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: withCommentId,
    },
    responses: defaultResponse(safeCommentSchema, [201, 409]),
});
