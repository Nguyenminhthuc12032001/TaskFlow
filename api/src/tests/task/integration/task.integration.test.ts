import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createProject, createTask, createWorkspace, registerAndLogin } from "../../helper.js";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeColumnsSchema } from "../../../modules/column/column.schemas.js";
import { randomUUID } from "node:crypto";
import { safeAssigneeSchema, type CreateBodyType } from "../../../modules/task/task.schemas.js";
import { WorkspaceRole } from "../../../../prisma/generated/enums.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('Task', async () => {
    //  Create task: POST /api/tasks/:workspaceId/:projectId/:columnId
    void it('create task successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnBody = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnBody.ok, true);
        assert.ok(parsedListColumnBody.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnBody.data.data[0].id);

        assert.equal(createTaskResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
    });

    void it('reject unauthenticated user', async () => {
        const payload: CreateBodyType = {
            title: `Task ${randomUUID()}`,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${randomUUID()}/${randomUUID()}/${randomUUID()}`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 401);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
        assert.equal(parsedBody.message, 'Unauthorized');
    });

    void it('reject outsider from creating task', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnBody = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnBody.ok, true);
        assert.ok(parsedListColumnBody.data.data.length > 0);

        const regsterAndLoginResponseOutsider = await registerAndLogin(testServer);

        const payload: CreateBodyType = {
            title: `Task ${randomUUID()}`,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnBody.data.data[0].id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${regsterAndLoginResponseOutsider.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
        assert.equal(parsedBody.message, 'Forbidden');
    });

    void it('reject role that is not allwed to create task', async () => {
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

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id, WorkspaceRole.member);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnBody = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnBody.ok, true);
        assert.ok(parsedListColumnBody.data.data.length > 0);

        const payload: CreateBodyType = {
            title: `Task ${randomUUID()}`,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnBody.data.data[0].id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
        assert.equal(parsedBody.message, 'Forbidden');
    });

    void it('reject creating task when workspace not exist', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const payload: CreateBodyType = {
            title: `Task ${randomUUID()}`,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${randomUUID()}/${randomUUID()}/${randomUUID()}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.code, 'WORKSPACE_NOT_FOUND');
        assert.equal(parsedBody.message, 'Workspace not found');
    });

    void it('reject creating task when project not exist', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const payload: CreateBodyType = {
            title: `Task ${randomUUID()}`,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${randomUUID()}/${randomUUID()}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.code, 'PROJECT_NOT_IN_WORKSPACE');
        assert.equal(parsedBody.message, 'Project not found');
    });

    void it('reject creating task when column not exist', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const payload: CreateBodyType = {
            title: `Task ${randomUUID()}`,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${randomUUID()}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.code, 'COLUMN_NOT_IN_PROJECT');
        assert.equal(parsedBody.message, 'Column not found');
    });

    void it('reject creating task in a column that does not belong to the project', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

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

        const listColumnOutsideProjectResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse2.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnOutsideProjectResponse.res.status, 200);

        const parsedListColumnOutsideProjectResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnOutsideProjectResponse.body);
        assert.equal(parsedListColumnOutsideProjectResponse.ok, true);
        assert.ok(parsedListColumnOutsideProjectResponse.data.data.length > 0);

        const payload: CreateBodyType = {
            title: `Task ${randomUUID()}`,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnOutsideProjectResponse.data.data[0].id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.code, 'COLUMN_NOT_IN_PROJECT');
        assert.equal(parsedBody.message, 'Column not found');
    });

    void it('reject creating colum when missing title', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload: CreateBodyType = {
            title: '',
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject blank title after trimming', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload: CreateBodyType = {
            title: '   ',
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject title exceeding maximum length', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload: CreateBodyType = {
            title: 'a'.repeat(256),
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject invalid dueDate', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = {
            title: `Task ${randomUUID()}`,
            dueDate: 'invalid date',
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject invalid enum value', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = {
            title: `Task ${randomUUID()}`,
            priority: 'invalid priority',
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    // Assign task: POST /api/tasks/:workspaceId/:projectId/:columnId/:taskId
    void it('assign a task to a workspace member successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const registerAndLoginResponse2 = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponse2.body.data.user.id);

        const payload = {
            userId: registerAndLoginResponse2.body.data.user.id,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 201);

        const parsedBody = createdEnvelopeSchema(safeAssigneeSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.taskId, createTaskResponse.body.data.id);
        assert.equal(parsedBody.data.userId, registerAndLoginResponse2.body.data.user.id);
    });

    void it('reject unauthenticated user assign task', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const payload = {
            userId: registerAndLoginResponse.body.data.user.id,
        };

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 401);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject outsider from assigning task', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const create = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const registerAndLoginResponse2 = await registerAndLogin(testServer);

        const payload = {
            userId: registerAndLoginResponse2.body.data.user.id,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${create.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'User is not a member of this workspace');
        assert.equal(parsedBody.code, 'FORBIDDEN');
    });

    void it('reject member from assigning a task', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const registerAndLoginResponse2 = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponse2.body.data.user.id);

        const payload = {
            userId: randomUUID(),
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse2.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject viewer from assigning a task', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const registerAndLoginResponse2 = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponse2.body.data.user.id, WorkspaceRole.viewer);

        const payload = {
            userId: randomUUID(),
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse2.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('return not found when task does not exist', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = {
            userId: randomUUID(),
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${randomUUID()}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Task not found');
        assert.equal(parsedBody.code, 'TASK_NOT_IN_COLUMN');
    });

    void it('reject task that does not belong to the given column', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const payload = {
            userId: randomUUID(),
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[1].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Task not found');
        assert.equal(parsedBody.code, 'TASK_NOT_IN_COLUMN');
    });

    void it('reject project does not belong to the given workspace', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createWorkspaceResponse2 = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse2 = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse2.body.data.id);

        const payload = {
            userId: randomUUID(),
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse2.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${randomUUID()}`, {
            method: 'POST',
            body: JSON.stringify(payload),
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

    void it('reject assigning task to a non-existent user', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const payload = {
            userId: randomUUID(),
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'User does not exist');
        assert.equal(parsedBody.code, 'NOT_FOUND');
    });

    void it('reject assigning task to a user outside the workspace', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createWorkspaceResponse2 = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse2.body.data.id, registerAndLoginResponseOutsider.body.data.user.id);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const payload = {
            userId: registerAndLoginResponseOutsider.body.data.user.id,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'User is not a member of this workspace');
        assert.equal(parsedBody.code, 'FORBIDDEN');
    });

    void it('reject missing assigneeId', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const payload = {}

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject invalid assigneeId format', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const payload = {
            userId: 'not_a_uuid',
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });        

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it("handles assigning the same user twice correctly", async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const createTaskResponse = await createTask(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id, createProjectResponse.body.data.id, parsedListColumnsResponse.data.data[0].id);

        const payload = {
            userId: registerAndLoginResponse.body.data.user.id,
        }

        const { res, body } = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });
        
        assert.equal(res.status, 201);

        const parsedBody = createdEnvelopeSchema(safeAssigneeSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.userId, registerAndLoginResponse.body.data.user.id);

        const reAssignResponse = await jsonRequest(testServer, `/api/tasks/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}/${createTaskResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });        

        assert.equal(reAssignResponse.res.status, 409);

        const parsedReAssignBody = failEnvelopeSchema.parse(reAssignResponse.body);
        assert.equal(parsedReAssignBody.ok, false);
        assert.equal(parsedReAssignBody.message, 'User is already assigned to this task');
        assert.equal(parsedReAssignBody.code, 'CONFLICT');
    });
});
