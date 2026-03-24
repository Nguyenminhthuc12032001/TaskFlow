import { registry } from "../../docs/openapi.js";
import z, { type ZodType } from "../../docs/zod.js";
import { created201, fail400, fail401, fail403, fail404, fail409, fail500, ok200 } from "../auth/auth.openApi.js";
import { createBodySchema, createFollowUpTaskBodySchema, safeLeadSchema, safeLeadsSchema, safeLeadWithTaskLinksSchema, updateBodySchema, updateStageBodySchema } from "./lead.schemas.js";

const defaultPath = "/api/leads/{workspaceId}";

const defaultParams = z.object({
    workspaceId: z.uuid()
});

const withLeadId = defaultParams.extend({
    leadId: z.uuid()
});

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
    tags: ["Lead"],
    summary: "Create new lead",
    security: [{ bearerAuth: [] }],
    request : {
        body: {
            content: { "application/json": { schema: createBodySchema } },
            required: true
        },
        params: defaultParams
    },
    responses: defaultResponse(safeLeadSchema, [200])
});

registry.registerPath({
    method: "get",
    path: defaultPath + "/{leadId}",
    tags: ["Lead"],
    summary: "Get by lead Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: withLeadId
    },
    responses: defaultResponse(safeLeadWithTaskLinksSchema, [201, 409])
});

registry.registerPath({
    method: "get",
    path: defaultPath,
    tags: ["Lead"],
    summary: "List by workspace",
    security: [{ bearerAuth: [] }],
    request: {
        params: defaultParams
    },
    responses: defaultResponse(safeLeadsSchema, [201, 409])
});

registry.registerPath({
    method: "patch",
    path: defaultPath + "/{leadId}",
    tags: ["Lead"],
    summary: "Update by Id",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: updateBodySchema } }
        },
        params: withLeadId
    },
    responses: defaultResponse(safeLeadSchema, [201])
});

registry.registerPath({
    method: "patch",
    path: defaultPath + "/{leadId}/updateStage",
    tags: ["Lead"],
    summary: "Update lead stage",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: updateStageBodySchema } }
        },
        params: withLeadId
    },
    responses: defaultResponse(safeLeadSchema, [201])
});

registry.registerPath({
    method: "patch",
    path: defaultPath + "/{leadId}/{taskId}/linkTask",
    tags: ["Lead"],
    summary: "Link task",
    security: [{ bearerAuth: [] }],
    request: {
        params: withLeadId.extend({
            taskId: z.uuid()
        })
    },
    responses: defaultResponse(safeLeadWithTaskLinksSchema, [201])
});

registry.registerPath({
    method: "patch",
    path: defaultPath + "/{leadId}/{taskId}/unlinkTask",
    tags: ["Lead"],
    summary: "Unlink task",
    security: [{ bearerAuth: [] }],
    request: {
        params: withLeadId.extend({
            taskId: z.uuid()
        })
    },
    responses: defaultResponse(safeLeadWithTaskLinksSchema, [201, 409])
});

registry.registerPath({
    method: "post",
    path: defaultPath + "/{leadId}",
    tags: ["Lead"],
    summary: "Create follow up task",
    security: [{ bearerAuth: [] }],
    request: {
        body: { 
            content: { "application/json": { schema: createFollowUpTaskBodySchema } }
         },
        params: withLeadId
    },
    responses: defaultResponse(safeLeadWithTaskLinksSchema, [200])
});

registry.registerPath({
    method: "delete",
    path: defaultPath + "/{leadId}",
    tags: ["Lead"],
    summary: "Delete by Id",
    security: [{ bearerAuth: [] }],
    request: {
        params: withLeadId
    },
    responses: defaultResponse(safeLeadWithTaskLinksSchema, [201, 409])
});