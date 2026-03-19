import z from "zod";
import { registry } from "../../docs/openapi.js";
import { createBodySchema, reOrderBodySchema, safeColumnSchema, safeColumnsSchema, updateBodySchema } from "./column.schemas.js";
import { created201, fail400, fail401, fail403, fail404, fail409, fail500, ok200 } from "../auth/auth.openApi.js";
registry.registerPath({
    method: "post",
    path: "/api/columns/{workspaceId}/{projectId}",
    tags: ["Column"],
    summary: "Create new column",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: createBodySchema } },
            required: true
        },
        params: z.object({
            workspaceId: z.uuid(),
            projectId: z.uuid()
        })
    },
    responses: {
        201: created201(safeColumnSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        409: fail409,
        500: fail500
    }
});
registry.registerPath({
    method: "get",
    path: "/api/columns/{workspaceId}/{projectId}",
    tags: ["Column"],
    summary: "List by projectId",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
            projectId: z.uuid()
        })
    },
    responses: {
        200: ok200(safeColumnsSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        500: fail500
    }
});
registry.registerPath({
    method: "get",
    path: "/api/columns/{workspaceId}/{projectId}/{columnId}",
    tags: ["Column"],
    summary: "Get by column Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
            projectId: z.uuid(),
            columnId: z.uuid()
        })
    },
    responses: {
        200: ok200(safeColumnSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        500: fail500
    }
});
registry.registerPath({
    method: "patch",
    path: "/api/columns/{workspaceId}/{projectId}/re_order",
    tags: ["Column"],
    summary: "Re order columns of project",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: reOrderBodySchema } },
            required: true
        },
        params: z.object({
            workspaceId: z.uuid(),
            projectId: z.uuid()
        })
    },
    responses: {
        200: ok200(safeColumnsSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        500: fail500
    }
});
registry.registerPath({
    method: "patch",
    path: "/api/columns/{workspaceId}/{projectId}/{columnId}",
    tags: ["Column"],
    summary: "Update name of column by Id",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: updateBodySchema } }
        },
        params: z.object({
            workspaceId: z.uuid(),
            projectId: z.uuid(),
            columnId: z.uuid()
        })
    },
    responses: {
        200: ok200(safeColumnSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        409: fail409,
        500: fail500
    }
});
registry.registerPath({
    method: "delete",
    path: "/api/columns/{workspaceId}/{projectId}/{columnId}",
    tags: ["Column"],
    summary: "Delete column by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
            projectId: z.uuid(),
            columnId: z.uuid()
        })
    },
    responses: {
        200: ok200(safeColumnSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        500: fail500
    }
});
