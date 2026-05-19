import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createProject, createWorkspace, registerAndLogin } from "../../helper.js";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeColumnsSchema } from "../../../modules/column/column.schemas.js";
import { randomUUID } from "node:crypto";
import { listProjectsResponseSchema, safeProjectResponseSchema } from "../../../modules/project/project.schemas.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('project', () => {
    void it('create a project an returns safe project payload', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const { body } = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in body.data, false);
        assert.equal('updatedAt' in body.data, false);
    });

    void it('creates default kaban colums after project creation', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        //  Gọi GET /api/columns/:workspaceId/:projectId?page=1&limit=10
        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}?page=1&limit=10`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeColumnsSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 3);
        assert.equal(parsedBody.data.data.some(column => column.name === 'Todo' && column.position === 1 && column.type === 'todo'), true);
        assert.equal(parsedBody.data.data.some(column => column.name === 'In Progress' && column.position === 2 && column.type === 'in_process'), true);
        assert.equal(parsedBody.data.data.some(column => column.name === 'Done' && column.position === 3 && column.type === 'done'), true);
    });

    void it('reject unauthorized project creation', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const payload = {
            name: `Project ${randomUUID()}`,
            workspaceId: createWorkspaceResponse.body.data.id,
        };

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(res.status, 401);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject unauthenticated project listing', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);
        await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);
        await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}?page=1&limit=10`, {
            method: 'GET',
        });

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(res.status, 401);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject unauthenticated detail request', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
        });

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(res.status, 401);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject unauthenticated project update', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const payload = {
            name: `Project ${randomUUID()}`,
        };

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(res.status, 401);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject unauthenticated  project deletion', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'DELETE',
        });

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(res.status, 401);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject non-member from listing workspace projects', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject non-member from reading project detail', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    // rejects non-members from mutating projects
    void it('reject non-member from creating projects', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const payload = {
            name: `Project ${randomUUID()}`,
            description: 'Project 1 description',
        };

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject non-member from updating projects', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const payload = {
            name: `Project ${randomUUID()}`,
            description: 'Project 1 description',
        };

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject non-member from deletion projects', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject members or viewers from creating projects', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const payload = {
            name: `Project ${randomUUID()}`,
            description: 'Project 1 description',
        };

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject members or viewers from updating projects', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const payload = {
            name: `Project ${randomUUID()}`,
            description: 'Project 1 description',
        };

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject members or viewers from deleting projects', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('allows workspace members to list projects', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(listProjectsResponseSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data[0].id, createProjectResponse.body.data.id);
        assert.equal(parsedBody.data.data[0].name, createProjectResponse.body.data.name);
        assert.equal(parsedBody.data.data[0].description, createProjectResponse.body.data.description);
        assert.equal(parsedBody.data.data[0].workspaceId, createWorkspaceResponse.body.data.id);
        assert.equal(parsedBody.data.data[0].createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(new Date(parsedBody.data.data[0].createdAt).getTime()), false);
        assert.equal('deletedAt' in parsedBody.data.data[0], false);
        assert.equal('updatedAt' in parsedBody.data.data[0], false);
    });

    void it('allows workspace members to read project detail', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeProjectResponseSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, createProjectResponse.body.data.id);
        assert.equal(parsedBody.data.name, createProjectResponse.body.data.name);
        assert.equal(parsedBody.data.description, createProjectResponse.body.data.description);
        assert.equal(parsedBody.data.workspaceId, createWorkspaceResponse.body.data.id);
        assert.equal(parsedBody.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
        assert.equal('updatedAt' in parsedBody.data, false);
    });

    void it('reject duplicate project name in same workspace', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const payload = {
            name: createProjectResponse.body.data.name,
            description: 'Project 1 description',
        };

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 409);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Duplicate name is not allowed');
    });

    void it('allows the same project name in different workspaces', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const createWorkspaceResponse2 = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse2.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const payload = {
            name: createProjectResponse.body.data.name,
            description: 'Project 1 description',
        };

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse2.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 201);

        const parsedBody = createdEnvelopeSchema(safeProjectResponseSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.created, true);
        assert.equal(parsedBody.data.name, createProjectResponse.body.data.name);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
        assert.equal('updatedAt' in parsedBody.data, false);
    });

    void it('list only projects in selected workspace', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const createWorkspaceResponse2 = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse2.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse2 = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse2.body.data.id);

        assert.equal(createProjectResponse2.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse2.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse2.body.data.createdAt.getTime()), false); 

        assert.equal('deletedAt' in createProjectResponse2.body.data, false);
        assert.equal('updatedAt' in createProjectResponse2.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(listProjectsResponseSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data[0].id, createProjectResponse.body.data.id);
        assert.equal(parsedBody.data.data[0].name, createProjectResponse.body.data.name);
        assert.equal(parsedBody.data.data[0].description, createProjectResponse.body.data.description);
        assert.equal(parsedBody.data.data[0].workspaceId, createWorkspaceResponse.body.data.id);
        assert.equal(parsedBody.data.data[0].createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(new Date(parsedBody.data.data[0].createdAt).getTime()), false);
        assert.equal('deletedAt' in parsedBody.data.data[0], false);
        assert.equal('updatedAt' in parsedBody.data.data[0], false);
    });

    void it('returns project detail for workspace member', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeProjectResponseSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, createProjectResponse.body.data.id);
        assert.equal(parsedBody.data.name, createProjectResponse.body.data.name);
        assert.equal(parsedBody.data.description, createProjectResponse.body.data.description);
        assert.equal(parsedBody.data.workspaceId, createWorkspaceResponse.body.data.id);
        assert.equal(parsedBody.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
        assert.equal('updatedAt' in parsedBody.data, false);
    });

    void it('return 404 when project does not exist', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${randomUUID()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Project not found');
        assert.equal(parsedBody.code, 'PROJECT_NOT_IN_WORKSPACE');
    });

    void it('return 404 when project belongs to another workspace', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const createWorkspaceResponse2 = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse2.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse2.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Project not found');
        assert.equal(parsedBody.code, 'PROJECT_NOT_IN_WORKSPACE');
    });

    void it('updates a project and returns updated payload', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const payload = {
            name: `Project ${randomUUID()}`,
            description: 'Project 1 description',
        };

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeProjectResponseSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.name, payload.name);
        assert.equal(parsedBody.data.description, payload.description);
    });

    void it('rejects updating project to a duplicate name', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const createProjectResponse2 = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse2.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse2.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse2.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse2.body.data, false);
        assert.equal('updatedAt' in createProjectResponse2.body.data, false);

        const payload = {
            name: createProjectResponse.body.data.name,
            description: 'Project 1 description',
        };

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse2.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 409);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Duplicate name is not allowed');
    });

    void it('deletes a project success and return project payload', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeProjectResponseSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, createProjectResponse.body.data.id);
        assert.equal(parsedBody.data.name, createProjectResponse.body.data.name);
        assert.equal(parsedBody.data.description, createProjectResponse.body.data.description);
        assert.equal(parsedBody.data.createdBy, createProjectResponse.body.data.createdBy);
        assert.equal(parsedBody.data.workspaceId, createProjectResponse.body.data.workspaceId);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);
    });

    void it('dees not return deleted project from detail endpoint', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeProjectResponseSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, createProjectResponse.body.data.id);
        assert.equal(parsedBody.data.name, createProjectResponse.body.data.name);
        assert.equal(parsedBody.data.description, createProjectResponse.body.data.description);
        assert.equal(parsedBody.data.createdBy, createProjectResponse.body.data.createdBy);
        assert.equal(parsedBody.data.workspaceId, createProjectResponse.body.data.workspaceId);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const getProjectResponse = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(getProjectResponse.res.status, 404);

        const parsedGetProjectResponse = failEnvelopeSchema.parse(getProjectResponse.body);
        assert.equal(parsedGetProjectResponse.ok, false);
    });

    void it('does not include deleted projects in workspace project list', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeProjectResponseSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, createProjectResponse.body.data.id);
        assert.equal(parsedBody.data.name, createProjectResponse.body.data.name);
        assert.equal(parsedBody.data.description, createProjectResponse.body.data.description);
        assert.equal(parsedBody.data.createdBy, createProjectResponse.body.data.createdBy);
        assert.equal(parsedBody.data.workspaceId, createProjectResponse.body.data.workspaceId);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listProjectsResponse = await jsonRequest(testServer, `/api/projects/${createWorkspaceResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listProjectsResponse.res.status, 200);

        const parsedListProjectsResponse = okEnvelopeSchema(listProjectsResponseSchema).parse(listProjectsResponse.body);
        assert.equal(parsedListProjectsResponse.ok, true);
        assert.equal(parsedListProjectsResponse.data.data.length, 0);
    });
});
