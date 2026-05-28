import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createComment, createTask, registerAndLogin, setupCommentContext, setupTaskContext } from "../../helper.js";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeCommentSchema, safeCommentsSchema } from "../../../modules/comment/comment.schemas.js";
import { WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('comment/list', async () => {
    void it('list comments by task successfully', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data[0].id, comment.body.data.id);
        assert.equal(parsedBody.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[0].content, comment.body.data.content);

        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[0].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].updatedAt.getTime()), false);

        assert.equal('deletedAt' in parsedBody.data.data[0], false);
    });

    void it('return empty list if no comments', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 0);
    });

    void it('allow viewer to list comments', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const registerAndLoginViewer = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerAndLoginViewer.body.data.user.id, WorkspaceRole.viewer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data[0].id, comment.body.data.id);
        assert.equal(parsedBody.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[0].content, comment.body.data.content);
    });

    void it('reject unauthenticated request from listing comments', async () => {
        const { workspace, project, columnId, task } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {});

        assert.equal(res.status, 401);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject outsider from lising commets', async () => {
        const { workspace, project, columnId, task } = await setupCommentContext(testServer);

        const registerAndLoginOutsider = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
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

    void it('reject invalid workspace/project/column/task id format from listing comments', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/WRONG_WORKSPACE_ID_FORMAT/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/WRONG_PROJECT_ID_FORMAT/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res3, body: body3 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/WRONG_COLUMN_ID_FORMAT/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res4, body: body4 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/WRONG_TASK_ID_FORMAT`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);
        assert.equal(res2.status, 400);
        assert.equal(res3.status, 400);
        assert.equal(res4.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        const parsedBody2 = failEnvelopeSchema.parse(body2);
        const parsedBody3 = failEnvelopeSchema.parse(body3);
        const parsedBody4 = failEnvelopeSchema.parse(body4);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');

        assert.equal(parsedBody2.ok, false);
        assert.equal(parsedBody2.message, 'Invalid request parameters');
        assert.equal(parsedBody2.code, 'VALIDATION_ERROR');

        assert.equal(parsedBody3.ok, false);
        assert.equal(parsedBody3.message, 'Invalid request parameters');
        assert.equal(parsedBody3.code, 'VALIDATION_ERROR');

        assert.equal(parsedBody4.ok, false);
        assert.equal(parsedBody4.message, 'Invalid request parameters');
        assert.equal(parsedBody4.code, 'VALIDATION_ERROR');
    });

    void it('reject invalid resource chain from listing comments', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${randomUUID()}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${randomUUID()}/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res3, body: body3 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${randomUUID()}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res4, body: body4 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${randomUUID()}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 404);
        assert.equal(res2.status, 404);
        assert.equal(res3.status, 404);
        assert.equal(res4.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        const parsedBody2 = failEnvelopeSchema.parse(body2);
        const parsedBody3 = failEnvelopeSchema.parse(body3);
        const parsedBody4 = failEnvelopeSchema.parse(body4);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Workspace not found');
        assert.equal(parsedBody.code, 'WORKSPACE_NOT_FOUND');

        assert.equal(parsedBody2.ok, false);
        assert.equal(parsedBody2.message, 'Project not found');
        assert.equal(parsedBody2.code, 'PROJECT_NOT_IN_WORKSPACE');

        assert.equal(parsedBody3.ok, false);
        assert.equal(parsedBody3.message, 'Column not found');
        assert.equal(parsedBody3.code, 'COLUMN_NOT_IN_PROJECT');

        assert.equal(parsedBody4.ok, false);
        assert.equal(parsedBody4.message, 'Task not found');
        assert.equal(parsedBody4.code, 'TASK_NOT_IN_COLUMN');
    });

    void it('only returns comments of requested task', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const createTaskRes = await createTask(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId);

        await createComment(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, createTaskRes.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data[0].id, comment.body.data.id);
        assert.equal(parsedBody.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[0].content, comment.body.data.content);
        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[0].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].updatedAt.getTime()), false);

        assert.equal('deletedAt' in parsedBody.data.data[0], false);
    });

    void it('orders comment by createdAt desc from listing comments', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const createCommentRes = await createComment(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.data.data.length, 2);
        assert.equal(parsedBody.data.data[0].id, createCommentRes.body.data.id);
        assert.equal(parsedBody.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[0].content, createCommentRes.body.data.content);
        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[0].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].updatedAt.getTime()), false);

        assert.equal(parsedBody.data.data[1].id, comment.body.data.id);
        assert.equal(parsedBody.data.data[1].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[1].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[1].content, comment.body.data.content);
        assert.equal(parsedBody.data.data[1].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[1].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[1].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[1].updatedAt.getTime()), false);

        assert.equal('deletedAt' in parsedBody.data.data[0], false);
        assert.equal('deletedAt' in parsedBody.data.data[1], false);
    });

    void it('supports pagination', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const createCommentRes = await createComment(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?page=1&limit=1`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data[0].id, createCommentRes.body.data.id);
        assert.equal(parsedBody.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[0].content, createCommentRes.body.data.content);
        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[0].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].updatedAt.getTime()), false);

        assert.equal(parsedBody.data.paginationMeta.page, 1);
        assert.equal(parsedBody.data.paginationMeta.limit, 1);
        assert.equal(parsedBody.data.paginationMeta.totalItems, 2);
        assert.equal(parsedBody.data.paginationMeta.totalPages, 2);
        assert.equal(parsedBody.data.paginationMeta.hasNextPage, true);
        assert.equal(parsedBody.data.paginationMeta.hasPrevPage, false);

        assert.equal('deletedAt' in parsedBody.data.data[0], false);

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?page=2&limit=1`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res2.status, 200);

        const parsedBody2 = okEnvelopeSchema(safeCommentsSchema).parse(body2);
        assert.equal(parsedBody2.data.data.length, 1);
        assert.equal(parsedBody2.data.data[0].id, comment.body.data.id);
        assert.equal(parsedBody2.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody2.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody2.data.data[0].content, comment.body.data.content);
        assert.equal(parsedBody2.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody2.data.data[0].createdAt.getTime()), false);
        assert.equal(parsedBody2.data.data[0].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody2.data.data[0].updatedAt.getTime()), false);

        assert.equal(parsedBody2.data.paginationMeta.page, 2);
        assert.equal(parsedBody2.data.paginationMeta.limit, 1);
        assert.equal(parsedBody2.data.paginationMeta.totalItems, 2);
        assert.equal(parsedBody2.data.paginationMeta.totalPages, 2);
        assert.equal(parsedBody2.data.paginationMeta.hasNextPage, false);
        assert.equal(parsedBody2.data.paginationMeta.hasPrevPage, true);

        assert.equal('deletedAt' in parsedBody2.data.data[0], false);
    });

    void it('uses default pagination', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const createCommentRes = await createComment(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.data.data.length, 2);
        assert.equal(parsedBody.data.data[0].id, createCommentRes.body.data.id);
        assert.equal(parsedBody.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[0].content, createCommentRes.body.data.content);
        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[0].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].updatedAt.getTime()), false);

        assert.equal(parsedBody.data.data[1].id, comment.body.data.id);
        assert.equal(parsedBody.data.data[1].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[1].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[1].content, comment.body.data.content);
        assert.equal(parsedBody.data.data[1].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[1].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[1].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[1].updatedAt.getTime()), false);

        assert.equal(parsedBody.data.paginationMeta.page, 1);
        assert.equal(parsedBody.data.paginationMeta.limit, 10);
        assert.equal(parsedBody.data.paginationMeta.totalItems, 2);
        assert.equal(parsedBody.data.paginationMeta.totalPages, 1);
        assert.equal(parsedBody.data.paginationMeta.hasNextPage, false);
        assert.equal(parsedBody.data.paginationMeta.hasPrevPage, false);

        assert.equal('deletedAt' in parsedBody.data.data[0], false);
        assert.equal('deletedAt' in parsedBody.data.data[1], false);
    });

    void it('clamps limit greater than 100', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        await createComment(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?limit=101`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.data.data.length, 2);
        assert.equal(parsedBody.data.paginationMeta.limit, 100);
        assert.equal(parsedBody.data.paginationMeta.totalItems, 2);
        assert.equal(parsedBody.data.paginationMeta.totalPages, 1);

        assert.equal('deletedAt' in parsedBody.data.data[0], false);
        assert.equal('deletedAt' in parsedBody.data.data[1], false);
    });

    void it('reject invalid pagination query', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?page=invalid&limit=invalid`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid query parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('filter by search case-insensitively', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?search=test`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data[0].id, comment.body.data.id);
        assert.equal(parsedBody.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[0].content, comment.body.data.content);
        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[0].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].updatedAt.getTime()), false);

        assert.equal('deletedAt' in parsedBody.data.data[0], false);
    });

    void it('ignores blank search', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?search=`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data[0].id, comment.body.data.id);
        assert.equal(parsedBody.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[0].content, comment.body.data.content);
        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[0].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].updatedAt.getTime()), false);

        assert.equal('deletedAt' in parsedBody.data.data[0], false);
    });

    void it('reject search longer than 100 characters', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?search=${'a'.repeat(101)}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid query parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('filter by parenId', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const reply = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify({ content: 'test reply' }),
        })

        assert.equal(reply.res.status, 201);

        const parsedReply = createdEnvelopeSchema(safeCommentSchema).parse(reply.body); 

        assert.equal(parsedReply.data.authorId, auth.body.data.user.id);
        assert.equal(parsedReply.data.taskId, task.body.data.id);
        assert.equal(parsedReply.data.content, 'test reply');
        assert.equal(parsedReply.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedReply.data.createdAt.getTime()), false);
        assert.equal(parsedReply.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedReply.data.updatedAt.getTime()), false);


        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?parentId=${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data[0].id, parsedReply.data.id);
        assert.equal(parsedBody.data.data[0].authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.data[0].taskId, task.body.data.id);
        assert.equal(parsedBody.data.data[0].content, parsedReply.data.content);
        assert.equal(parsedBody.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].createdAt.getTime()), false);
        assert.equal(parsedBody.data.data[0].updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.data[0].updatedAt.getTime()), false);

        assert.equal('deletedAt' in parsedBody.data.data[0], false);
    });

    void it('reject invalid parentId from listing comments', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?parentId=invalid`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid query parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject invalid date range startDate > endDate', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const startDate = new Date();
        const endDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 2);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid query parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject future date range', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 2);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Start date must be in the past');
        assert.equal(parsedBody.code, 'INVALID_ERROR');
    });
});