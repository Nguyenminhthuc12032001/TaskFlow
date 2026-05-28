import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createComment, createProject, createTask, createWorkspace, registerAndLogin, setupCommentContext } from "../../helper.js";
import assert from "node:assert";
import { failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeCommentSchema } from "../../../modules/comment/comment.schemas.js";
import { ActivityAction, WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";
import { prisma } from "../../../db/prisma.js";
import { safeColumnsSchema } from "../../../modules/column/column.schemas.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('comment/delete', async () => {
    void it('delete comment successfully', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const registerAndLoginMemberRes = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, registerAndLoginMemberRes.body.data.user.id, WorkspaceRole.member);

        const registerAndLoginAdminRes = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, registerAndLoginAdminRes.body.data.user.id, WorkspaceRole.admin); 

        const comment = await createComment(testServer, registerAndLoginMemberRes.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, task.body.data.id);
        const comment2 = await createComment(testServer, registerAndLoginAdminRes.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, task.body.data.id);
        const comment3 = await createComment(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginMemberRes.body.data.accessToken}`
            },
            method: 'DELETE'
        });

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment2.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        const { res: res3, body: body3 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment3.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginAdminRes.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.equal(res2.status, 200);
        assert.equal(res3.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentSchema).parse(body);
        const parsedBody2 = okEnvelopeSchema(safeCommentSchema).parse(body2);
        const parsedBody3 = okEnvelopeSchema(safeCommentSchema).parse(body3);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, comment.body.data.id);
        assert.equal(parsedBody.data.authorId, registerAndLoginMemberRes.body.data.user.id);
        assert.equal(typeof parsedBody.data.id, 'string');
        assert.equal(parsedBody.data.content, comment.body.data.content);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false); 

        assert.equal(parsedBody2.ok, true);
        assert.equal(parsedBody2.data.id, comment2.body.data.id);
        assert.equal(parsedBody2.data.authorId, registerAndLoginAdminRes.body.data.user.id);
        assert.equal(typeof parsedBody2.data.id, 'string');
        assert.equal(parsedBody2.data.content, comment2.body.data.content);
        assert.equal(parsedBody2.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody2.data.createdAt.getTime()), false);
        assert.equal(parsedBody2.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody2.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody2.data, false);

        assert.equal(parsedBody3.ok, true);
        assert.equal(parsedBody3.data.id, comment3.body.data.id);
        assert.equal(parsedBody3.data.authorId, auth.body.data.user.id);
        assert.equal(typeof parsedBody3.data.id, 'string');
        assert.equal(parsedBody3.data.content, comment3.body.data.content);
        assert.equal(parsedBody3.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody3.data.createdAt.getTime()), false);
        assert.equal(parsedBody3.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody3.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody3.data, false);
    });

    void it('remove deleted comment from database or mark it as deleted', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'DELETE'
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

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res2.status, 404);

        const parsedBody2 = failEnvelopeSchema.parse(body2);
        assert.equal(parsedBody2.ok, false);
        assert.equal(parsedBody2.message, 'Comment not found');
        assert.equal(parsedBody2.code, 'COMMENT_NOT_IN_TASK');
    });

    void it('reject when user does not a member of workspace', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);
        
        const registerAndLoginRes = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginRes.body.data.accessToken}`
            },
            method: 'DELETE'
        });

        assert.equal(res.status, 403);
        
        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject when user does not have a permission to delete comment', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const registerAndLoginMemberRes = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerAndLoginMemberRes.body.data.user.id, WorkspaceRole.member);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginMemberRes.body.data.accessToken}`
            },
            method: 'DELETE'
        });

        assert.equal(res.status, 403);
        
        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, `You don't have permission to delete this comment`);
        assert.equal(parsedBody.code, 'NOT_COMMENT_AUTHOR');

        const registerAndLoginViewerRes = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerAndLoginViewerRes.body.data.user.id, WorkspaceRole.viewer);

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginViewerRes.body.data.accessToken}`
            },
            method: 'DELETE'
        });

        assert.equal(res2.status, 403);

        const parsedBody2 = failEnvelopeSchema.parse(body2);
        assert.equal(parsedBody2.ok, false);
        assert.equal(parsedBody2.message, 'Forbidden');
        assert.equal(parsedBody2.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject when comment does not exist', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);
    
        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${randomUUID()}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'DELETE'
        });
    
        assert.equal(res.status, 404);
    
        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Comment not found');
        assert.equal(parsedBody.code, 'COMMENT_NOT_IN_TASK');
    });

    void it('reject when ids are invalid', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);
    
        const { res, body } = await jsonRequest(testServer, `/api/comments/innvalid-id/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'DELETE'
        });
        
        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/innvalid-id/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'DELETE'
        });
        
        const { res: res3, body: body3 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/innvalid-id/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'DELETE'
        });
        
        const { res: res4, body: body4 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/innvalid-id/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'DELETE'
        });
        
        const { res: res5, body: body5 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/innvalid-id`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'DELETE'
        });
    
        assert.equal(res.status, 400);
        assert.equal(res2.status, 400);
        assert.equal(res3.status, 400);
        assert.equal(res4.status, 400);
        assert.equal(res5.status, 400);
    
        const parsedBody = failEnvelopeSchema.parse(body);
        const parsedBody2 = failEnvelopeSchema.parse(body2);
        const parsedBody3 = failEnvelopeSchema.parse(body3);
        const parsedBody4 = failEnvelopeSchema.parse(body4);
        const parsedBody5 = failEnvelopeSchema.parse(body5);
    
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
    
        assert.equal(parsedBody5.ok, false);
        assert.equal(parsedBody5.message, 'Invalid request parameters');
        assert.equal(parsedBody5.code, 'VALIDATION_ERROR');
    });

    void it('reject when comment does not belong to given task', async () => {
        const { auth, workspace, project, columnId, comment } = await setupCommentContext(testServer);

        const createTaskRes = await createTask(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId);
    
        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${createTaskRes.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'DELETE'
        });
    
        assert.equal(res.status, 404);
    
        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Comment not found');
        assert.equal(parsedBody.code, 'COMMENT_NOT_IN_TASK'); 
    });

    void it('reject when delete comment belong to another workspace', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);
    
        const createWorkspaceRes = await createWorkspace(testServer, auth.body.data.accessToken);

        const createProjectRes = await createProject(testServer, auth.body.data.accessToken, createWorkspaceRes.body.data.id);

        const listColumnsRes = await jsonRequest(testServer, `/api/columns/${createWorkspaceRes.body.data.id}/${createProjectRes.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'GET'
        }); 

        assert.equal(listColumnsRes.res.status, 200);

        const parsedColumns = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsRes.body);
        assert.equal(parsedColumns.ok, true);
        assert.ok(parsedColumns.data.data.length > 0);
        
        const createTaskRes = await createTask(testServer, auth.body.data.accessToken, createWorkspaceRes.body.data.id, createProjectRes.body.data.id, parsedColumns.data.data[0].id);
    
        const createCommentRes = await createComment(testServer, auth.body.data.accessToken, createWorkspaceRes.body.data.id, createProjectRes.body.data.id, parsedColumns.data.data[0].id, createTaskRes.body.data.id);
    
        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${createCommentRes.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'DELETE'
        });
    
        assert.equal(res.status, 404);
    
        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Comment not found');
        assert.equal(parsedBody.code, 'COMMENT_NOT_IN_TASK');
    });

    void it('should not emit activity/audit event when delete fails', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const registerAndLoginViewerRes = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerAndLoginViewerRes.body.data.user.id, WorkspaceRole.viewer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerAndLoginViewerRes.body.data.accessToken}`
            },
            method: 'DELETE'
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, `Forbidden`);
        assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');

        const activityLogs = await prisma.activityLog.findMany({
            where: {
                workspaceId: workspace.body.data.id,
                actorId: registerAndLoginViewerRes.body.data.user.id,
                action: ActivityAction.DELETE_COMMENT,
                entityType: 'comment',
                entityId: comment.body.data.id,
                deletedAt: null,
            }
        })

        assert.equal(activityLogs.length, 0);
    });
});