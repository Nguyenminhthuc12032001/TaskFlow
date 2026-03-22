import { registry } from "../../docs/openapi.js";
import z, { type ZodType } from "../../docs/zod.js";
import { created201, fail400, fail401, fail403, fail404, fail409, fail500, ok200 } from "../auth/auth.openApi.js";
import { createBodySchema, safeCommentSchema, safeCommentsSchema, updateBodySchema } from "./comment.schemas.js";

const defaultPath = "/api/comments/{workspaceId}/{projectId}/{columnId}/{taskId}";

const defaultParams = z.object({
    workspaceId: z.uuid(),
    projectId: z.uuid(),
    columnId: z.uuid(),
    taskId: z.uuid()
});

const withCommentId = defaultParams.extend({ commentId: z.uuid() });

const defaultResponse = (
    schema: ZodType,
    exclude: Array<200 | 201 | 400 | 401 | 403 | 404 | 409 | 500> = []
) => {
    const responses = {
        200: ok200(schema),
        201: created201(schema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        409: fail409,
        500: fail500
    };

    for (const code of exclude) {
        delete responses[code];
    }

    return responses;
};

registry.registerPath({
    method: "post",
    path: defaultPath,
    tags: ["Comment"],
    summary: "Create new comment",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: createBodySchema } },
            required: true
        },
        params: defaultParams
    },
    responses: defaultResponse(safeCommentSchema, [200, 409])
});

registry.registerPath({
    method: "post",
    path: defaultPath + "/{commentId}",
    tags: ["Comment"],
    summary: "Reply to comment",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: createBodySchema } },
            required: true
        },
        params: withCommentId
    },
    responses: defaultResponse(safeCommentSchema, [200, 409])
});

registry.registerPath({
    method: "get",
    path: defaultPath,
    tags: ["Comment"],
    summary: "List comments",
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams
    },
    responses: defaultResponse(safeCommentsSchema, [201, 409])
});

registry.registerPath({
    method: "get",
    path: defaultPath + "/{commentId}",
    tags: ["Comment"],
    summary: "Get comment by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: withCommentId
    },
    responses: defaultResponse(safeCommentSchema, [201, 409])
});

registry.registerPath({
    method: "patch",
    path: defaultPath + "/{commentId}",
    tags: ["Comment"],
    summary: "Update comment by Id",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: updateBodySchema } },
            required: true
        },
        params: withCommentId
    },
    responses: defaultResponse(safeCommentSchema, [201, 409])
});

registry.registerPath({
    method: "delete",
    path: defaultPath + "/{commentId}",
    tags: ["Comment"],
    summary: "Delete comment by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: withCommentId
    },
    responses: defaultResponse(safeCommentSchema, [201, 409])
});