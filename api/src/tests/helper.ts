import { randomInt, randomUUID } from "node:crypto";
import { jsonRequest, type TestServer } from "./testServer.js";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../common/utils/response/format.js";
import { loginResponseSchema } from "../modules/auth/auth.schemas.js";
import { createResponseSchema } from "../modules/workspace/workspace.schemas.js";
import { safeProjectResponseSchema } from "../modules/project/project.schemas.js";
import { LeadStage, TaskPriority, type WorkspaceRole } from "../../prisma/generated/enums.js";
import { prisma } from "../db/prisma.js";
import assert from "node:assert";
import { safeTaskSchema, type CreateBodyType } from "../modules/task/task.schemas.js";
import { safeColumnsSchema } from "../modules/column/column.schemas.js";
import { safeCommentSchema } from "../modules/comment/comment.schemas.js";
import { safeLeadSchema, safeLeadTaskLinkSchema, type CreateBodyType as CreateLeadBodyType } from "../modules/lead/lead.schemas.js";
import { faker } from '@faker-js/faker';

export const uniqueEmail = (): string => `auth-${randomUUID()}@auth.test`;
export const uniquePhoneNumber = (): string => {
    return faker.helpers.fromRegExp('[+]1201555[0-9]{4}');
};

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

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const parsed = okEnvelopeSchema(loginResponseSchema).parse(body);

    assert.equal(parsed.ok, true);
    assert.ok(parsed.data.accessToken.length > 0);
    assert.equal(typeof parsed.data.accessToken, 'string');
    assert.equal(typeof parsed.data.user.id, 'string');
    assert.equal(parsed.data.user.email, payload.email);
    assert.equal(parsed.data.user.name, name);

    assert.equal('passwordHash' in parsed.data.user, false);
    assert.equal('passwordSalt' in parsed.data.user, false);

    return {
        res,
        body: parsed,
    }
};

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

    assert.equal(res.status, 201);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const parsed = createdEnvelopeSchema(createResponseSchema).parse(body);

    assert.equal(parsed.ok, true);
    assert.equal(parsed.created, true);
    assert.equal(typeof parsed.data.id, 'string');
    assert.equal(parsed.data.name, name);

    return {
        res,
        body: parsed,
    }
};

export async function setupWorkspaceContext(testServer: TestServer): Promise<{
    auth: {
        res: Response;
        body: {
            ok: boolean;
            data: {
                accessToken: string;
                user: {
                    id: string;
                    email: string;
                    name: string;
                };
            };
        };
    };
    workspace: {
        res: Response;
        body: {
            ok: boolean;
            created: boolean;
            data: {
                id: string;
                name: string;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    };
}> {
    const auth = await registerAndLogin(testServer);

    const workspace = await createWorkspace(testServer, auth.body.data.accessToken);

    return {
        auth,
        workspace,
    }
}

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

    assert.equal(res.status, 201);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const parsed = createdEnvelopeSchema(safeProjectResponseSchema).parse(body);

    assert.equal(parsed.ok, true);
    assert.equal(parsed.created, true);
    assert.equal(parsed.data.workspaceId, workspaceId);
    assert.equal(typeof parsed.data.id, 'string');
    assert.equal(parsed.data.name, payload.name);
    assert.equal(parsed.data.description, payload.description);

    return {
        res,
        body: parsed
    }
};

export async function setupProjectContext(testServer: TestServer): Promise<{
    auth: {
        res: Response;
        body: {
            ok: boolean;
            data: {
                accessToken: string;
                user: {
                    id: string;
                    email: string;
                    name: string;
                };
            };
        };
    };
    workspace: {
        res: Response;
        body: {
            ok: boolean;
            created: boolean;
            data: {
                id: string;
                name: string;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    };
    project: {
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
    };
}> {
    const auth = await registerAndLogin(testServer);
    const workspace = await createWorkspace(testServer, auth.body.data.accessToken);
    const project = await createProject(testServer, auth.body.data.accessToken, workspace.body.data.id);

    return {
        auth,
        workspace,
        project
    }
}

export async function createTask(
    testServer: TestServer,
    accessToken: string,
    workspaceId: string,
    projectId: string,
    columnId: string,
    payload: CreateBodyType = {
        title: `Test task ${randomUUID()}`,
        description: 'Test task description',
        priority: TaskPriority.low,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
): Promise<{
    res: Response;
    body: {
        ok: true;
        created: true;
        data: {
            id: string;
            projectId: string;
            columnId: string;
            title: string;
            priority: TaskPriority;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
            description?: string | undefined;
            dueDate?: Date | undefined;
            position?: number | undefined;
        };
    };
}> {
    const { res, body } = await jsonRequest(testServer, `/api/tasks/${workspaceId}/${projectId}/${columnId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    })

    assert.equal(res.status, 201);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const parsed = createdEnvelopeSchema(safeTaskSchema).parse(body);

    assert.equal(parsed.ok, true);
    assert.equal(parsed.created, true);
    assert.equal(parsed.data.projectId, projectId);
    assert.equal(parsed.data.columnId, columnId);
    assert.equal(typeof parsed.data.id, 'string');
    assert.equal(parsed.data.title, payload.title);
    assert.equal(parsed.data.description, payload.description);
    assert.equal(parsed.data.priority, payload.priority);
    assert.equal(parsed.data.dueDate instanceof Date, true);
    assert.equal(parsed.data.createdAt instanceof Date, true);
    assert.equal(Number.isNaN(parsed.data.createdAt.getTime()), false);
    assert.equal(parsed.data.updatedAt instanceof Date, true);
    assert.equal(Number.isNaN(parsed.data.updatedAt.getTime()), false);

    assert.equal('deletedAt' in parsed.data, false);

    return {
        res,
        body: parsed
    }
}

export async function setupTaskContext(testServer: TestServer): Promise<{
    auth: {
        res: Response;
        body: {
            ok: boolean;
            data: {
                accessToken: string;
                user: {
                    id: string;
                    email: string;
                    name: string;
                };
            };
        };
    };
    workspace: {
        res: Response;
        body: {
            ok: boolean;
            created: boolean;
            data: {
                id: string;
                name: string;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    };
    project: {
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
    }
    columnId: string;
    task: {
        res: Response;
        body: {
            ok: true;
            created: true;
            data: {
                id: string;
                projectId: string;
                columnId: string;
                title: string;
                priority: TaskPriority;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
                dueDate?: Date | undefined;
                position?: number | undefined;
            };
        };
    }
}> {
    const auth = await registerAndLogin(testServer);
    const workspace = await createWorkspace(testServer, auth.body.data.accessToken);
    const project = await createProject(testServer, auth.body.data.accessToken, workspace.body.data.id);

    const listColumn = await jsonRequest(testServer, `/api/columns/${workspace.body.data.id}/${project.body.data.id}`, {
        headers: {
            Authorization: `Bearer ${auth.body.data.accessToken}`,
        }
    });

    assert.equal(listColumn.res.status, 200);

    const columns = okEnvelopeSchema(safeColumnsSchema).parse(listColumn.body);

    assert.equal(columns.ok, true);
    assert.ok(columns.data.data.length > 0);

    const columnId = columns.data.data[0].id;

    const task = await createTask(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId);

    assert.equal(task.res.status, 201);

    return {
        auth,
        workspace,
        project,
        columnId,
        task,
    }
}

export async function createComment(
    testServer: TestServer,
    accessToken: string,
    workspaceId: string,
    projectId: string,
    columnId: string,
    taskId: string
): Promise<{
    res: Response;
    body: {
        ok: true;
        created: true;
        data: {
            id: string;
            taskId: string;
            authorId: string;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            parentId?: string | undefined;
        };
    };
}> {
    const payload = {
        content: 'test comment'
    }

    const { res, body } = await jsonRequest(testServer, `/api/comments/${workspaceId}/${projectId}/${columnId}/${taskId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    })

    assert.equal(res.status, 201);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const parsed = createdEnvelopeSchema(safeCommentSchema).parse(body);

    assert.equal(parsed.ok, true);
    assert.equal(parsed.created, true);
    assert.equal(parsed.data.taskId, taskId);
    assert.equal(typeof parsed.data.id, 'string');
    assert.equal(parsed.data.content, payload.content);
    assert.equal(parsed.data.createdAt instanceof Date, true);
    assert.equal(Number.isNaN(parsed.data.createdAt.getTime()), false);
    assert.equal(parsed.data.updatedAt instanceof Date, true);
    assert.equal(Number.isNaN(parsed.data.updatedAt.getTime()), false);

    assert.equal('deletedAt' in parsed.data, false);

    return {
        res,
        body: parsed
    }
}

export async function setupCommentContext(testServer: TestServer): Promise<{
    auth: {
        res: Response;
        body: {
            ok: boolean;
            data: {
                accessToken: string;
                user: {
                    id: string;
                    email: string;
                    name: string;
                };
            };
        };
    };
    workspace: {
        res: Response;
        body: {
            ok: boolean;
            created: boolean;
            data: {
                id: string;
                name: string;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    };
    project: {
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
    }
    columnId: string;
    task: {
        res: Response;
        body: {
            ok: true;
            created: true;
            data: {
                id: string;
                projectId: string;
                columnId: string;
                title: string;
                priority: TaskPriority;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
                description?: string | undefined;
                dueDate?: Date | undefined;
                position?: number | undefined;
            };
        };
    };
    comment: {
        res: Response;
        body: {
            ok: true;
            created: true;
            data: {
                id: string;
                taskId: string;
                authorId: string;
                content: string;
                createdAt: Date;
                updatedAt: Date;
                parentId?: string | undefined;
            };
        }
    };
}> {
    const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

    const comment = await createComment(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, task.body.data.id);

    return {
        auth,
        workspace,
        project,
        columnId,
        task,
        comment,
    }
};

export async function createLead(testServer: TestServer, accessToken: string, workspaceId: string): Promise<{
    res: Response;
    body: {
        ok: true;
        created: true;
        data: {
            id: string;
            workspaceId: string;
            name: string;
            stage: LeadStage;
            note: string;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
            email?: string | undefined;
            phone?: string | undefined;
            source?: string | undefined;
        };
    };
}> {
    const payload: CreateLeadBodyType = {
        name: `Test lead ${randomUUID()}`,
        note: `Test note ${randomUUID()}`,
        email: uniqueEmail(),
        phone: uniquePhoneNumber(),
        source: `Test source ${randomUUID()}`,
        stage: LeadStage.new
    }

    const { res, body } = await jsonRequest(testServer, `/api/leads/${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    })

    assert.equal(res.status, 201);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const parsed = createdEnvelopeSchema(safeLeadSchema).parse(body);

    assert.equal(parsed.ok, true);
    assert.equal(parsed.created, true);
    assert.equal(typeof parsed.data.id, 'string');
    assert.equal(parsed.data.name, payload.name);
    assert.equal(parsed.data.note, payload.note);
    assert.equal(parsed.data.email, payload.email);
    assert.equal(parsed.data.phone, payload.phone);
    assert.equal(parsed.data.source, payload.source);
    assert.equal(parsed.data.stage, payload.stage);
    assert.equal(parsed.data.createdAt instanceof Date, true);
    assert.equal(Number.isNaN(parsed.data.createdAt.getTime()), false);
    assert.equal(parsed.data.updatedAt instanceof Date, true);
    assert.equal(Number.isNaN(parsed.data.updatedAt.getTime()), false);

    assert.equal('deletedAt' in parsed.data, false);

    return {
        res,
        body: parsed
    }
}

export async function setupLeadContext(testServer: TestServer): Promise<{
    auth: {
        res: Response;
        body: {
            ok: boolean;
            data: {
                accessToken: string;
                user: {
                    id: string;
                    email: string;
                    name: string;
                };
            };
        };
    };
    workspace: {
        res: Response;
        body: {
            ok: boolean;
            created: boolean;
            data: {
                id: string;
                name: string;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    };
    lead: {
        res: Response;
        body: {
            ok: true;
            created: true;
            data: {
                id: string;
                workspaceId: string;
                name: string;
                stage: LeadStage;
                note: string;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
                email?: string | undefined;
                phone?: string | undefined;
                source?: string | undefined;
            };
        };
    };
}> {
    const auth = await registerAndLogin(testServer);
    const workspace = await createWorkspace(testServer, auth.body.data.accessToken);
    const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

    return { auth, workspace, lead }
}

export async function linkTask(testServer: TestServer, accessToken: string, workspaceId: string, leadId: string, taskId: string): Promise<{
    res: Response;
    body: {
        ok: true;
        created: true;
        data: {
            leadId: string;
            taskId: string;
        };
    };
}> {
    const { res, body } = await jsonRequest(testServer, `/api/leads/${workspaceId}/${leadId}/${taskId}/linkTask`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    assert.equal(res.status, 201);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const parsed = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(body);

    assert.equal(parsed.ok, true);
    assert.equal(parsed.created, true); 
    assert.equal(parsed.data.leadId, leadId);
    assert.equal(parsed.data.taskId, taskId); 

    return {
        res,
        body: parsed
    }
}
