import { registry } from "../../docs/openapi.js";
import { createBodySchema, listProjectsResponseSchema, safeProjectResponseSchema, updateBodySchema } from "./project.schemas.js";
import z from "../../docs/zod.js";
import { defaultResponse } from "../workspace/workspace.openApi.js";

const defaultPath = "/api/projects/{workspaceId}";

const defaultParams = z.object({
    workspaceId: z.uuid(),
});

registry.registerPath({
    method: "post",
    path: defaultPath,
    tags: ["Project"],
    summary: "Create new project",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: createBodySchema } },
            required: true,
        },
        params: defaultParams
    },
    responses: defaultResponse(safeProjectResponseSchema, [200])
});

registry.registerPath({
    method: "get",
    path: defaultPath + "/{projectId}",
    tags: ["Project"],
    summary: "Get project by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams.extend({
            projectId: z.uuid()
        })
    },
    responses: defaultResponse(safeProjectResponseSchema, [201, 409])
});

registry.registerPath({
    method: "get",
    path: defaultPath,
    tags: ["Project"],
    summary: "List by workspace Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams
    },
    responses: defaultResponse(listProjectsResponseSchema, [201, 409])
});

registry.registerPath({
    method: "patch",
    path: defaultPath + "/{projectId}",
    tags: ["Project"],
    summary: "Update project by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams.extend({
            projectId: z.uuid()
        }),
        body: {
            content: { "application/json": { schema: updateBodySchema } },
            required: true
        }
    },
    responses: defaultResponse(safeProjectResponseSchema, [201])
});

registry.registerPath({
    method: "delete",
    path: defaultPath + "/{projectId}",
    tags: ["Project"],
    summary: "Remove project by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams.extend({
            projectId: z.uuid()
        })
    },
    responses: defaultResponse(safeProjectResponseSchema, [201, 409])
});




