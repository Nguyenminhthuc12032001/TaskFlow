import { registry } from "../../docs/openapi.js";
import { acceptBodySchema, acceptResponseSchema, createBodySchema, createResponseSchema, deleteResponseSchema, getByIdResponseSchema, getByUserIdResponseSchema, inviteBodySchema, inviteResponseSchema, membersResponseSchema, removeMemberResponseSchema, updateBodySchema, updateResponseSchema } from "./workspace.schemas.js";
import { created201, fail400, fail401, fail403, fail404, fail409, fail500, ok200 } from "../auth/auth.openApi.js";
import z from "zod";

registry.registerPath({
    method: "post",
    path: "/api/workspace/create",
    tags: ["Workspace"],
    summary: "Create new Workspace",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: createBodySchema } }
        }
    },
    responses: {
        201: created201(createResponseSchema),
        400: fail400,
        401: fail401,
        409: fail409,
        500: fail500
    }
});

registry.registerPath({
    method: "get",
    path: "/api/workspace/list",
    tags: ["Workspace"],
    summary: "Get list workspace by user ID",
    security: [{ bearerAuth: [] }],
    responses: {
        200: ok200(getByUserIdResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        500: fail500
    }
});

registry.registerPath({
    method: "get",
    path: "/api/workspace/{workspaceId}",
    tags: ["Workspace"],
    summary: "Get workspace by ID",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid()
        })
    },
    responses: {
        200: ok200(getByIdResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        500: fail500
    }
});

registry.registerPath({
    method: "get",
    path: "/api/workspace/members/{workspaceId}",
    tags: ["Workspace"],
    summary: "Get members by workspace ID",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid()
        })
    },
    responses: {
        200: ok200(membersResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        500: fail500
    }
});

registry.registerPath({
    method: "put",
    path: "/api/workspace/{workspaceId}",
    tags: ["Workspace"],
    summary: "Update workspace name",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: updateBodySchema } }
        },
        params: z.object({
            workspaceId: z.uuid()
        })
    },
    responses: {
        200: ok200(updateResponseSchema),
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
    path: "/api/workspace/{workspaceId}",
    tags: ["Workspace"],
    summary: "Delete workspace by ID",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid()
        })
    },
    responses: {
        200: ok200(deleteResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        fail500: fail500
    }
});

registry.registerPath({
    method: "post",
    path: "/api/workspace/invite/{workspaceId}",
    tags: ["Workspace"],
    summary: "Invite member for workspace",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: inviteBodySchema } }
        },
        params: z.object({
            workspaceId: z.uuid()
        })
    },
    responses: {
        200: ok200(inviteResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        409: fail409,
        500: fail500
    }
});

registry.registerPath({
    method: "post",
    path: "/api/workspace/accept_invite",
    tags: ["Workspace"],
    summary: "Accept invite",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: acceptBodySchema } }
        }
    },
    responses: {
        201: created201(acceptResponseSchema),
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
    path: "/api/workspace/remove_member/{workspaceId}/{memberId}",
    tags: ["Workspace"],
    summary: "Remove member",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            workspaceId: z.uuid(),
            memberId: z.uuid()
        })
    },
    responses: {
        200: ok200(removeMemberResponseSchema),
        400: fail400,
        401: fail401,
        403: fail403,
        404: fail404,
        500: fail500
    }
})