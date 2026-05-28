import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createComment, createTask, registerAndLogin, setupCommentContext } from "../../helper.js";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeCommentSchema, safeCommentsSchema } from "../../../modules/comment/comment.schemas.js";
import { ActivityAction, WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { prisma } from "../../../db/prisma.js";
import { randomUUID } from "node:crypto";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('comment/reply', async () => {
    void it('reply comment successfully as owner', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payloadReply = {
            content: 'test reply comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        }); 

        assert.equal(res.status, 201);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.created, true);
        assert.equal(parsedBody.data.content, payloadReply.content);
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.parentId, comment.body.data.id);
        assert.ok(parsedBody.data.createdAt instanceof Date);
        assert.ok(parsedBody.data.updatedAt instanceof Date);

        assert.equal('deletedAt' in parsedBody.data, false);
    });

    void it('reply comment successfully as member', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const registerResMember = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, registerResMember.body.data.user.id, WorkspaceRole.member);

        const payloadReply = {
            content: 'test reply comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${registerResMember.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        });

        assert.equal(res.status, 201);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.created, true);
        assert.equal(parsedBody.data.content, payloadReply.content);
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, registerResMember.body.data.user.id);
        assert.equal(parsedBody.data.parentId, comment.body.data.id);
        assert.ok(parsedBody.data.createdAt instanceof Date);
        assert.ok(parsedBody.data.updatedAt instanceof Date);

        assert.equal('deletedAt' in parsedBody.data, false);
    });

    void it('persist reply and get reply by id', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payloadReply = {
            content: 'test reply comment'
        }

        const { res: replyRes, body: replyBody } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        });

        assert.equal(replyRes.status, 201);

        const parsedReplyBody = createdEnvelopeSchema(safeCommentSchema).parse(replyBody);
        assert.equal(parsedReplyBody.ok, true);
        assert.equal(parsedReplyBody.created, true);
        assert.equal(parsedReplyBody.data.content, payloadReply.content);
        assert.equal(parsedReplyBody.data.taskId, task.body.data.id);
        assert.equal(parsedReplyBody.data.authorId, auth.body.data.user.id);
        assert.equal(parsedReplyBody.data.parentId, comment.body.data.id);
        assert.ok(parsedReplyBody.data.createdAt instanceof Date);
        assert.ok(parsedReplyBody.data.updatedAt instanceof Date);

        assert.equal('deletedAt' in parsedReplyBody.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${parsedReplyBody.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, parsedReplyBody.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(typeof parsedBody.data.id, 'string');
        assert.equal(parsedBody.data.content, payloadReply.content);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);

        assert.equal(parsedBody.data.parentId, comment.body.data.id);
    });

    void it('increase parent totalReplies after replying', async () => {
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
        })

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

    void it('count multiple replies correctly', async () => {
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
        })

        await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        })

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        })

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, comment.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(typeof parsedBody.data.id, 'string');
        assert.equal(parsedBody.data.content, comment.body.data.content);
        assert.equal(parsedBody.data.totalReplies, 2);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
    });

    void it('list replies by parentId', async () => {
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
        })

        await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        })

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}?parentId=${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        })

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeCommentsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 2);
        assert.equal(parsedBody.data.data.every(reply => reply.parentId === comment.body.data.id), true);
        assert.equal(parsedBody.data.data.every(reply => reply.taskId === task.body.data.id), true);
        assert.equal(parsedBody.data.data.every(reply => reply.authorId === auth.body.data.user.id), true);
        assert.equal(parsedBody.data.data.every(reply => reply.content === payloadReply.content), true);
        assert.equal(parsedBody.data.data.every(reply => reply.createdAt instanceof Date), true);
        assert.equal(parsedBody.data.data.every(reply => Number.isNaN(reply.createdAt.getTime()) === false), true);
        assert.equal(parsedBody.data.data.every(reply => reply.updatedAt instanceof Date), true);
        assert.equal(parsedBody.data.data.every(reply => Number.isNaN(reply.updatedAt.getTime()) === false), true);
        assert.equal(parsedBody.data.data.every(reply => 'deletedAt' in reply === false), true);
        assert.equal(parsedBody.data.data.every(reply => reply.content === comment.body.data.content), false);
    });

    void it('create activity log after creating reply', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payloadReply = {
            content: 'test reply comment'
        }

        const { res: replyRes, body: replyBody } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        })

        assert.equal(replyRes.status, 201);

        const parsedReplyBody = createdEnvelopeSchema(safeCommentSchema).parse(replyBody);
        assert.equal(parsedReplyBody.ok, true);
        assert.equal(parsedReplyBody.created, true);
        assert.equal(parsedReplyBody.data.parentId, comment.body.data.id);
        assert.equal(parsedReplyBody.data.authorId, auth.body.data.user.id);
        assert.equal(parsedReplyBody.data.taskId, task.body.data.id);
        assert.equal(parsedReplyBody.data.content, payloadReply.content);
        assert.equal(parsedReplyBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedReplyBody.data.createdAt.getTime()), false);
        assert.equal(parsedReplyBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedReplyBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedReplyBody.data, false);

        const activityLogs = await prisma.activityLog.findMany({
            where: {
                workspaceId: workspace.body.data.id,
                actorId: auth.body.data.user.id,
                action: ActivityAction.COMMENT_TASK,
                entityType: 'comment',
                entityId: parsedReplyBody.data.id,
                deletedAt: null,
            }
        })

        assert.equal(activityLogs.length, 1);

        const activityLog = activityLogs[0];
        assert.ok(activityLog);
        assert.equal(activityLog.workspaceId, workspace.body.data.id);
        assert.equal(activityLog.actorId, auth.body.data.user.id);
        assert.equal(activityLog.action, ActivityAction.COMMENT_TASK);
        assert.equal(activityLog.entityType, 'comment');
        assert.equal(activityLog.entityId, parsedReplyBody.data.id);
        assert.equal(activityLog.createdAt instanceof Date, true);
        assert.equal(typeof activityLog.meta, 'string');

        const meta = JSON.parse(activityLog.meta as string);
        assert.deepEqual(meta.comment, {
            id: parsedReplyBody.data.id,
            taskId: parsedReplyBody.data.taskId,
            authorId: parsedReplyBody.data.authorId,
            parentId: comment.body.data.id,
            content: payloadReply.content,
            createdAt: parsedReplyBody.data.createdAt.toISOString(),
            updatedAt: parsedReplyBody.data.updatedAt.toISOString(),
            deletedAt: null,
        });
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

    void it('reject outsider from rely comment', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const outsider = await registerAndLogin(testServer);

        const payloadReply = {
            content: 'test reply comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${outsider.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject viewer from rely comment', async () => {
        const { workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const viewer = await registerAndLogin(testServer);

        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const payloadReply = {
            content: 'test reply comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${viewer.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        });

        assert.equal(res.status, 403);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject missing content', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({})
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject blank content after trimming', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: '   ' })
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject content shorter than 5 characters', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test' })
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('accept content exactly 5 characters', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'tes t' })
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.content, 'tes t');
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);

        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
    });

    void it('accept content exactly 100 characters', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: `${'a'.repeat(100)}` })
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.content, `${'a'.repeat(100)}`);
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
    });

    void it('reject content greater than 100 characters', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: `${'a'.repeat(101)}` })
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject unknown body fields', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test', unknown: 'test' })
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject invalid UUID parameters', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/invalid-uuid/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test1' })
        });

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/invalid-uuid/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test2' })
        });

        const { res: res3, body: body3 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/invalid-uuid/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test3' })
        });

        const { res: res4, body: body4 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/invalid-uuid/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test4' })
        });

        const { res: res5, body: body5 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/invalid-uuid`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test5' })
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

    void it('reject invalid resource chain', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${randomUUID()}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test1' })
        });

        const { res: res2, body: body2 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${randomUUID()}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test2' })
        });

        const { res: res3, body: body3 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${randomUUID()}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test3' })
        });

        const { res: res4, body: body4 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${randomUUID()}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test4' })
        });

        const { res: res5, body: body5 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${randomUUID()}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test5' })
        });

        assert.equal(res.status, 404);
        assert.equal(res2.status, 404);
        assert.equal(res3.status, 404);
        assert.equal(res4.status, 404);
        assert.equal(res5.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        const parsedBody2 = failEnvelopeSchema.parse(body2);
        const parsedBody3 = failEnvelopeSchema.parse(body3);
        const parsedBody4 = failEnvelopeSchema.parse(body4);
        const parsedBody5 = failEnvelopeSchema.parse(body5);

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

        assert.equal(parsedBody5.ok, false);
        assert.equal(parsedBody5.message, 'Comment not found');
        assert.equal(parsedBody5.code, 'COMMENT_NOT_IN_TASK');
    });

    void it('reject parent comment in another task', async () => {
        const { auth, workspace, project, columnId, task } = await setupCommentContext(testServer);

        const createTaskRes = await createTask(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId);

        const createCommentRes = await createComment(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId, createTaskRes.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${createCommentRes.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify({ content: 'test1' })
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Comment not found');
        assert.equal(parsedBody.code, 'COMMENT_NOT_IN_TASK');
    });

    void it('allow nested reply', async () => {
        const { auth, workspace, project, columnId, task, comment } = await setupCommentContext(testServer);

        const payloadReply = {
            content: 'test reply comment'
        }

        const { res, body } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${comment.body.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        });

        assert.equal(res.status, 201);

        const parsedBody = createdEnvelopeSchema(safeCommentSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.created, true);
        assert.equal(parsedBody.data.content, payloadReply.content);
        assert.equal(parsedBody.data.taskId, task.body.data.id);
        assert.equal(parsedBody.data.authorId, auth.body.data.user.id);
        assert.equal(parsedBody.data.parentId, comment.body.data.id);
        assert.ok(parsedBody.data.createdAt instanceof Date);
        assert.ok(parsedBody.data.updatedAt instanceof Date);

        assert.equal('deletedAt' in parsedBody.data, false);

        const { res: res1, body: body1 } = await jsonRequest(testServer, `/api/comments/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${task.body.data.id}/${parsedBody.data.id}`, {
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            method: 'POST',
            body: JSON.stringify(payloadReply)
        });

        assert.equal(res1.status, 201);

        const parsedBody1 = createdEnvelopeSchema(safeCommentSchema).parse(body1);
        assert.equal(parsedBody1.ok, true);
        assert.equal(parsedBody1.created, true);
        assert.equal(parsedBody1.data.content, payloadReply.content);
        assert.equal(parsedBody1.data.taskId, task.body.data.id);
        assert.equal(parsedBody1.data.authorId, auth.body.data.user.id);
        assert.equal(parsedBody1.data.parentId, parsedBody.data.id);
        assert.ok(parsedBody1.data.createdAt instanceof Date);
        assert.ok(parsedBody1.data.updatedAt instanceof Date);

        assert.equal('deletedAt' in parsedBody1.data, false);
    });
});
