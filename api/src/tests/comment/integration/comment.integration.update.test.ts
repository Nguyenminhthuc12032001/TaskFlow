import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, registerAndLogin, setupCommentContext, setupTaskContext } from "../../helper.js";
import assert from "node:assert";
import { failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeCommentSchema } from "../../../modules/comment/comment.schemas.js";
import { WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('comment/update', async () => {
    void it('update own comment successfully', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payload = {
            content: 'test comment updated'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeCommentSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, comment.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(typeof parsedBody.data.id, 'string');
        assert.equal(parsedBody.data.content, payload.content);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);

        assert.equal('deletedAt' in parsedBody.data, false);
    });

    void it('persists updated comment content', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payload = {
            content: 'test comment updated'
        }

        const commentUpdateRes = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(commentUpdateRes.res.status, 200);
        assert.match(commentUpdateRes.res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(commentUpdateRes.body);

        const parsedCommentBody = okEnvelopeSchema(safeCommentSchema).parse(commentUpdateRes.body);

        assert.equal(parsedCommentBody.ok, true);
        assert.equal(parsedCommentBody.data.content, payload.content);

        const commentGetRes = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(commentGetRes.res.status, 200);
        assert.match(commentGetRes.res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(commentGetRes.body);

        const parsedCommentGetBody = okEnvelopeSchema(safeCommentSchema).parse(commentGetRes.body);

        assert.equal(parsedCommentGetBody.ok, true);
        assert.equal(parsedCommentGetBody.data.content, payload.content);
    });

    void it('reject unauthenticated request', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payload = {
            content: 'test comment updated'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 401);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject viewer from update comment', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const registerAndLoginViewer = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerAndLoginViewer.body.data.user.id, WorkspaceRole.viewer);

        const payload = {
            content: 'test comment updated'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
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

    void it('reject non-author from update comment', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const registerAndLoginNonAuthor = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerAndLoginNonAuthor.body.data.user.id, WorkspaceRole.member);

        const payload = {
            content: 'test comment updated'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${registerAndLoginNonAuthor.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, `You don't have permission to update this comment`);
        assert.equal(parsedBody.code, 'NOT_COMMENT_AUTHOR');
    });

    void it('return 404 when comment does not exist or belong to another task', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const payload = {
            content: 'test comment updated'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${randomUUID()}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Comment not found');
        assert.equal(parsedBody.code, 'COMMENT_NOT_IN_TASK');
    });

    void it('reject invalid content', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payload = {
            content: ''
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
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

    void it('reject update blank comment content after trim', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payload = {
            content: '   '
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
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

    void it('accept boundary exactly content length', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payload5 = {
            content: `${'a'.repeat(5)}`
        }

        const payload100 = {
            content: `${'a'.repeat(100)}`
        }

        const updateLengh5 = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload5)
        });

        const updateLengh100 = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload100)
        });

        assert.equal(updateLengh5.res.status, 200);
        assert.equal(updateLengh100.res.status, 200);

        const parsedBody5 = okEnvelopeSchema(safeCommentSchema).parse(updateLengh5.body);
        const parsedBody100 = okEnvelopeSchema(safeCommentSchema).parse(updateLengh100.body);

        assert.equal(parsedBody5.ok, true);
        assert.equal(parsedBody5.data.content, payload5.content);
        assert.equal(parsedBody5.data.taskId, task.body.data.id);
        assert.equal(parsedBody5.data.authorId, auth.body.data.user.id);

        assert.equal(parsedBody100.ok, true);
        assert.equal(parsedBody100.data.content, payload100.content);
        assert.equal(parsedBody100.data.taskId, task.body.data.id);
        assert.equal(parsedBody100.data.authorId, auth.body.data.user.id);
    });

    void it('reject unknown body fields', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payload = {
            content: 'test comment updated',
            unknown: 'unknown'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
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

    void it('reject outsider from updating comment', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const registerAndLoginOutsider = await registerAndLogin(testServer);

        const payload = {
            content: 'test comment updated'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
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

    // returns 404 for invalid resource chain
    void it('reject when invalid resource chain', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payload = {
            content: 'test comment updated'
        }

        const invalidWorkspaceRes = await jsonRequest(testServer, `/api/comments/${randomUUID()}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(invalidWorkspaceRes.res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(invalidWorkspaceRes.body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Workspace not found');
        assert.equal(parsedBody.code, 'WORKSPACE_NOT_FOUND');

        const invalidProjectRes = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${randomUUID()}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(invalidProjectRes.res.status, 404);

        const parsedBody2 = failEnvelopeSchema.parse(invalidProjectRes.body);
        assert.equal(parsedBody2.ok, false);
        assert.equal(parsedBody2.message, 'Project not found');
        assert.equal(parsedBody2.code, 'PROJECT_NOT_IN_WORKSPACE');

        const invalidColumnRes = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${randomUUID()}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(invalidColumnRes.res.status, 404);

        const parsedBody3 = failEnvelopeSchema.parse(invalidColumnRes.body);
        assert.equal(parsedBody3.ok, false);
        assert.equal(parsedBody3.message, 'Column not found');
        assert.equal(parsedBody3.code, 'COLUMN_NOT_IN_PROJECT');

        const invalidTaskRes = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${randomUUID()}/${comment.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(invalidTaskRes.res.status, 404);

        const parsedBody4 = failEnvelopeSchema.parse(invalidTaskRes.body);
        assert.equal(parsedBody4.ok, false);
        assert.equal(parsedBody4.message, 'Task not found');
        assert.equal(parsedBody4.code, 'TASK_NOT_IN_COLUMN');
    })
});