import z from '../../docs/zod.js';
import { registry } from '../../docs/openapi.js';
import { createBodySchema, reOrderBodySchema, safeColumnSchema, safeColumnsSchema, updateBodySchema, } from './column.schemas.js';
import { defaultResponse } from '../workspace/workspace.openApi.js';
import { paginationQuerySchema } from '../../common/schemas/common.schemas.js';
const defaultPath = '/api/columns/{workspaceId}/{projectId}';
const defaultParams = z.object({
    workspaceId: z.uuid(),
    projectId: z.uuid(),
});
registry.registerPath({
    method: 'post',
    path: defaultPath,
    tags: ['Column'],
    summary: 'Create new column',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: createBodySchema } },
            required: true,
        },
        params: defaultParams,
    },
    responses: defaultResponse(safeColumnSchema, [200]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath,
    tags: ['Column'],
    summary: 'List by projectId',
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams,
        query: paginationQuerySchema
    },
    responses: defaultResponse(safeColumnsSchema, [201, 409]),
});
registry.registerPath({
    method: 'get',
    path: defaultPath + '/{columnId}',
    tags: ['Column'],
    summary: 'Get by column Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams.extend({
            columnId: z.uuid(),
        }),
    },
    responses: defaultResponse(safeColumnSchema, [201, 409]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/re_order',
    tags: ['Column'],
    summary: 'Re order columns of project',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: reOrderBodySchema } },
            required: true,
        },
        params: defaultParams,
        query: paginationQuerySchema
    },
    responses: defaultResponse(safeColumnsSchema, [201, 409]),
});
registry.registerPath({
    method: 'patch',
    path: defaultPath + '/{columnId}',
    tags: ['Column'],
    summary: 'Update name of column by Id',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: updateBodySchema } },
        },
        params: defaultParams.extend({
            columnId: z.uuid(),
        }),
    },
    responses: defaultResponse(safeColumnSchema, [201]),
});
registry.registerPath({
    method: 'delete',
    path: defaultPath + '/{columnId}',
    tags: ['Column'],
    summary: 'Delete column by Id',
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams.extend({
            columnId: z.uuid(),
        }),
    },
    responses: defaultResponse(safeColumnSchema, [201, 409]),
});
