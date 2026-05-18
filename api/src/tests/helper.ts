import { randomUUID } from "node:crypto";
import { jsonRequest, type TestServer } from "./testServer.js";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../common/utils/response/format.js";
import { loginResponseSchema } from "../modules/auth/auth.schemas.js";
import { createResponseSchema } from "../modules/workspace/workspace.schemas.js";
import { safeProjectResponseSchema } from "../modules/project/project.schemas.js";
import type { WorkspaceRole } from "../../prisma/generated/enums.js";
import { prisma } from "../db/prisma.js";

export const uniqueEmail = (): string => `auth-${randomUUID()}@auth.test`;

export async function registerAndLogin(testServer: TestServer, name = 'Test User'): Promise<{
    res: Response,
    body: {
        ok: boolean,
        data: {
            accessToken: string,
            user: {
                id: string,
                email: string,
                name: string,
            }
        }
    }
}> {
    const payload = {
        email: uniqueEmail(),
        password: 'password123',
    };

    await jsonRequest(testServer, '/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            ...payload,
            name,
        })
    });

    const { res, body } = await jsonRequest(testServer, '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    return {
        res,
        body: okEnvelopeSchema(loginResponseSchema).parse(body),
    }
}

export async function createWorkspace(
    testServer: TestServer,
    token: string,
    name = `Test workspace ${randomUUID()}`,
): Promise<{
    res: Response,
    body: {
        ok: boolean,
        created: boolean
        data: {
            id: string,
            name: string,
            createdBy: string
            createdAt: Date
            updatedAt: Date
        }
    }
}> {
    const { res, body } = await jsonRequest(testServer, '/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
            name,
        }),
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });

    const parsed = createdEnvelopeSchema(createResponseSchema).parse(body);

    return {
        res,
        body: parsed,
    }
};

export async function addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: Exclude<WorkspaceRole, 'owner'> = 'member',
): Promise<{
    userId: string;
    deletedAt: Date | null;
    workspaceId: string;
    role: WorkspaceRole;
    joinedAt: Date;
}> {
    return prisma.workspaceMember.create({
        data: {
            workspaceId,
            userId,
            role,
            joinedAt: new Date(),
        }
    })
};

export async function createProject(
    testServer: TestServer,
    token: string,
    workspaceId: string,
    name = `Test project ${randomUUID()}`,
): Promise<{
    res: Response;
    body: {
        ok: true;
        created: true;
        data: {
            workspaceId: string;
            id: string;
            name: string;
            description: string;
            createdAt: Date;
            createdBy: string;
        };
    };
}> {
    const payload = {
        name,
        description: 'Test project description', 
    }
    const { res, body } = await jsonRequest(testServer, `/api/projects/${workspaceId}`, {
        method: 'POST', 
        body: JSON.stringify(payload),
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });

    return {
        res,
        body: createdEnvelopeSchema(safeProjectResponseSchema).parse(body),
    }
};
