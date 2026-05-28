import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createComment, createTask, registerAndLogin, setupCommentContext } from "../../helper.js";
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

void describe("comment/get", async () => {
    void it('get comment successfully', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, comment.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(typeof parsedBody.data.id, 'string');
        assert.equal(parsedBody.data.content, comment.body.data.content);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
    });

    void it('get comment have replies successfully', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payloadReply = {
            content: 'test reply comment'
        }

        await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        });

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, comment.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(typeof parsedBody.data.id, 'string');
        assert.equal(parsedBody.data.content, comment.body.data.content);
        assert.equal(parsedBody.data.totalReplies, 1);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
    });

    void it('reject unauthenticated request', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {});

        assert.equal(res.status, 401);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('allow viewer to get comment', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const registerAndLoginViewer = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerAndLoginViewer.body.data.user.id, WorkspaceRole.viewer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginViewer.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, comment.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(typeof parsedBody.data.id, 'string');
        assert.equal(parsedBody.data.content, comment.body.data.content);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
    });

    void it('reject outsider', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const registerAndLoginOutsider = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginOutsider.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject invalid workspaceId/projectId/columnId/taskId/commentId format', async () => {
        const { auth, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/invalid/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${project.body.data.id}/invalid/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res3, body: body3 } = await jsonRequest(testServer, `/api/comments/${project.body.data.id}/${columnId}/invalid/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res4, body: body4 } = await jsonRequest(testServer, `/api/comments/${project.body.data.id}/${columnId}/${task.body.data.id}/invalid/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res5, body: body5 } = await jsonRequest(testServer, `/api/comments/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}/invalid`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');

        assert.equal(res2.status, 400);

        const parsedBody2 = failEnvelopeSchema.parse(body2);
        assert.equal(parsedBody2.ok, false);
        assert.equal(parsedBody2.message, 'Invalid request parameters');
        assert.equal(parsedBody2.code, 'VALIDATION_ERROR');

        assert.equal(res3.status, 400);

        const parsedBody3 = failEnvelopeSchema.parse(body3);
        assert.equal(parsedBody3.ok, false);
        assert.equal(parsedBody3.message, 'Invalid request parameters');
        assert.equal(parsedBody3.code, 'VALIDATION_ERROR');

        assert.equal(res4.status, 400);

        const parsedBody4 = failEnvelopeSchema.parse(body4);
        assert.equal(parsedBody4.ok, false);
        assert.equal(parsedBody4.message, 'Invalid request parameters');
        assert.equal(parsedBody4.code, 'VALIDATION_ERROR');

        assert.equal(res5.status, 400);

        const parsedBody5 = failEnvelopeSchema.parse(body5);
        assert.equal(parsedBody5.ok, false);
        assert.equal(parsedBody5.message, 'Invalid request parameters');
        assert.equal(parsedBody5.code, 'VALIDATION_ERROR');
    });

    void it('reject when workspace does not exist', async () => {
        const { auth, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/invalid/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject when project/column/task/comment does not belong to the workspace/project/column/task', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${randomUUID()}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${randomUUID()}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res3, body: body3 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${randomUUID()}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res4, body: body4 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${randomUUID()}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Project not found');
        assert.equal(parsedBody.code, 'PROJECT_NOT_IN_WORKSPACE');

        assert.equal(res2.status, 404);

        const parsedBody2 = failEnvelopeSchema.parse(body2);
        assert.equal(parsedBody2.ok, false);
        assert.equal(parsedBody2.message, 'Column not found');
        assert.equal(parsedBody2.code, 'COLUMN_NOT_IN_PROJECT');

        assert.equal(res3.status, 404);

        const parsedBody3 = failEnvelopeSchema.parse(body3);
        assert.equal(parsedBody3.ok, false);
        assert.equal(parsedBody3.message, 'Task not found');
        assert.equal(parsedBody3.code, 'TASK_NOT_IN_COLUMN');

        assert.equal(res4.status, 404);

        const parsedBody4 = failEnvelopeSchema.parse(body4);
        assert.equal(parsedBody4.ok, false);
        assert.equal(parsedBody4.message, 'Comment not found');
        assert.equal(parsedBody4.code, 'COMMENT_NOT_IN_TASK');
    });

    void it('reject when comment belong to another task', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const createTaskRes = await createTask(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId);

        const createCommentRes = await createComment(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, createTaskRes.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${createCommentRes.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Comment not found');
        assert.equal(parsedBody.code, 'COMMENT_NOT_IN_TASK');
    });

    void it('dont return sensitive data', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, comment.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(typeof parsedBody.data.id, 'string');
        assert.equal(parsedBody.data.content, comment.body.data.content);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
    });
});