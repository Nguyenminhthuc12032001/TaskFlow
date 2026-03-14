import { registry } from "../../docs/openapi.js";
import { createBodySchema, listProjectsResponseSchema, safeProjectResponseSchema, updateBodySchema } from "./project.schemas.js";
import { created201, fail400, fail401, fail403, fail404, fail409, fail500, ok200 } from "../auth/auth.openApi.js";
import z from "../../docs/zod.js";

registry.registerPath({
    method: "post",
    path: "/api/projects/{workspaceId}/create",
    tags: ["Project"],
    summary: "Create new project",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: createBodySchema } },
            required: true,
        },
        params: z.object({
            workspaceId: z.uuid(),
        })
    },
    responses: {
        201: created201(safeProjectResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        409: fail409,
        500: fail500
    }
});

registry.registerPath({
    method: "get",
    path: "/api/projects/{workspaceId}/{projectId}",
    tags: ["Project"],
    summary: "Get project by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
            projectId: z.uuid()
        })
    },
    responses: {
        200: ok200(safeProjectResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        500: fail500
    }
});

registry.registerPath({
    method: "get",
    path: "/api/projects/{workspaceId}/list_by_workspace",
    tags: ["Project"],
    summary: "List by workspace Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid()
        })
    },
    responses: {
        200: ok200(listProjectsResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        500: fail500
    }
});

registry.registerPath({
    method: "patch",
    path: "/api/projects/{workspaceId}/update/{projectId}",
    tags: ["Project"],
    summary: "Update project by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
            projectId: z.uuid()
        }),
        body: {
            content: { "application/json": { schema: updateBodySchema } },
            required: true
        }
    },
    responses: {
        200: ok200(safeProjectResponseSchema),
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
    path: "/api/projects/{workspaceId}/remove/{projectId}",
    tags: ["Project"],
    summary: "Remove project by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
            projectId: z.uuid()
        })
    },
    responses: {
        200: ok200(safeProjectResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        500: fail500
    }
});




