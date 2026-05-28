import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createProject, createWorkspace, registerAndLogin, setupTaskContext } from "../../helper.js";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeCommentSchema } from "../../../modules/comment/comment.schemas.js";
import { prisma } from "../../../db/prisma.js";
import { ActivityAction, WorkspaceRole } from "../../../../prisma/generated/enums.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('comment/create', async () => {
    //  CREATE: POST /api/comments/:workspaceId/:projectId/:columnId/:taskId
    void it('create comment successfully as owner', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.content, payload.content);
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);

        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
    });

    void it('create comment successfully as member', async () => {
        const { workspace, project, columnId, task } = await setupTaskContext(testServer);

        const registerAndLoginMember = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerAndLoginMember.body.data.user.id, WorkspaceRole.member);

        const payload = {
            content: 'test comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginMember.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.content, payload.content);
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, registerAndLoginMember.body.data.user.id);

        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
    });

    void it('reject blank content after trimming', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: '   '
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    // creates activity log after creating comment
    void it('create activity log successfully', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.content, payload.content);
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);

        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);

        const activityLogs = await prisma.activityLog.findMany({
            where: {
                workspaceId: workspace.body.data.id,
                actorId: auth.body.data.user.id,
                action: ActivityAction.COMMENT_TASK,
                entityType: 'comment',
                entityId: parsedBody.data.id,
                deletedAt: null
            }
        })

        assert.equal(activityLogs.length, 1);

        const activityLog = activityLogs[0];
        assert.ok(activityLog);
        assert.equal(activityLog.workspaceId, workspace.body.data.id);
        assert.equal(activityLog.actorId, auth.body.data.user.id);
        assert.equal(activityLog.action, ActivityAction.COMMENT_TASK);
        assert.equal(activityLog.entityType, 'comment');
        assert.equal(activityLog.entityId, parsedBody.data.id);
        assert.equal(activityLog.createdAt instanceof Date, true);

        assert.equal(typeof activityLog.meta, 'string');

        const meta = JSON.parse(activityLog.meta as string);
        assert.deepEqual(meta.comment, {
            id: parsedBody.data.id,
            taskId: parsedBody.data.taskId,
            authorId: parsedBody.data.authorId,
            parentId: null,
            content: parsedBody.data.content,
            createdAt: parsedBody.data.createdAt.toISOString(),
            updatedAt: parsedBody.data.updatedAt.toISOString(),
            deletedAt: null,
        });
    });

    void it('reject unauthenticated request', async () => {
        const { workspace, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 401);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject outsider from creating comment', async () => {
        const { workspace, project, columnId, task } = await setupTaskContext(testServer);

        const registerAndLoginOutsider = await registerAndLogin(testServer);

        const payload = {
            content: 'test comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginOutsider.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject viewer from creating comment', async () => {
        const { workspace, project, columnId, task } = await setupTaskContext(testServer);

        const registerAndLoginViewer = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerAndLoginViewer.body.data.user.id, WorkspaceRole.viewer);

        const payload = {
            content: 'test comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginViewer.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject missing content from creating comment', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify({})
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject content shorter than 5 characters from creating comment', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify({
                content: 'test'
            })
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('accept content exactly 5 characters from creating comment', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test5'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.content, payload.content);
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);

        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
    });

    void it('accept content exactly 100 characters from creating comment', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: `${'a'.repeat(100)}`
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.content, payload.content);
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);

        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
    });

    void it('reject content greater than 100 characters from creating comment', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: `${'a'.repeat(101)}`
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject unknown body fields', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment',
            unknown: 'unknown'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject invalid workspace id format', async () => {
        const { auth, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/invalid-id/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject missing workspace id from creating comment', async () => {
        const { auth, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.match(parsedBody.message, /^Route not found:/);
        assert.equal(parsedBody.code, 'ROUTE_NOT_FOUND');
    });

    void it('reject project outside workspace from creating comment', async () => {
        const { auth, workspace, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment'
        }

        const createWorkspaceRes = await createWorkspace(testServer, auth.body.data.accessToken);

        const createProjectRes = await createProject(testServer, auth.body.data.accessToken, createWorkspaceRes.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${createProjectRes.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Project not found');
        assert.equal(parsedBody.code, 'PROJECT_NOT_IN_WORKSPACE');
    });

    void it('reject column outside project from creating comment', async () => {
        const { auth, workspace, project, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment'
        }

        const { columnId } = await setupTaskContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Column not found');
        assert.equal(parsedBody.code, 'COLUMN_NOT_IN_PROJECT');
    });

    void it('reject task outside column from creating comment', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment'
        }

        const { task } = await setupTaskContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Task not found');
        assert.equal(parsedBody.code, 'TASK_NOT_IN_COLUMN');
    });
});