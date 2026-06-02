import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, createTask, createWorkspace, linkTask, registerAndLogin, setupTaskContext, unLinkTask } from "../../helper.js";
import { prisma } from "../../../db/prisma.js";
import assert from "node:assert";
import { WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { failEnvelopeSchema } from "../../../common/utils/response/format.js";
import { randomUUID } from "node:crypto";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('lead/unlinkTask', () => {
    void it('unlinks a existing task', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        await unLinkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);
    });

    void it('deletes exactly one record LeadTaskLink with { leadId: $leadId, taskId: $taskId }', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const countBeforeUnlink = await prisma.leadTaskLink.count({ where: { leadId: lead.body.data.id, taskId: task.body.data.id } });

        assert.equal(countBeforeUnlink, 1);

        await unLinkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const countAfterUnlink = await prisma.leadTaskLink.count({ where: { leadId: lead.body.data.id, taskId: task.body.data.id } });

        assert.equal(countAfterUnlink, 0);
    });

    void it('keeps the lead record unchanged', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        await unLinkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const leadAfterUnlink = await prisma.lead.findUnique({ where: { id: lead.body.data.id } });

        assert.ok(leadAfterUnlink);

        const { deletedAt, ...leadAfterUnlinkWithoutDeletedAt } = leadAfterUnlink;

        assert.equal(deletedAt, null);
        assert.deepStrictEqual(leadAfterUnlinkWithoutDeletedAt, lead.body.data);
    });

    void it('keeps the task record unchanged', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        await unLinkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const taskAfterUnlink = await prisma.task.findUnique({ where: { id: task.body.data.id } });

        assert.ok(taskAfterUnlink);

        const { deletedAt, isArchiv, ...taskAfterUnlinkWithoutDeletedAt } = taskAfterUnlink;

        assert.equal(deletedAt, null);
        assert.equal(isArchiv, false);
        assert.deepStrictEqual(taskAfterUnlinkWithoutDeletedAt, task.body.data);
    });

    void it('afters unlink, lead detail no longer returns the task in taskLinks', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);
        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        await unLinkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const leadAfterUnlink = await prisma.lead.findUnique({ where: { id: lead.body.data.id }, include: { taskLinks: true } });

        assert.ok(leadAfterUnlink);
        assert.equal(leadAfterUnlink.taskLinks.length, 0);
    });

    void it('allows workspace owner/admin/member (member if they created the lead) to unlink task', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const owner = auth;
        const admin = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const lead = await createLead(testServer, member.body.data.accessToken, workspace.body.data.id);
        const lead2 = await createLead(testServer, member.body.data.accessToken, workspace.body.data.id);
        const lead3 = await createLead(testServer, member.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, owner.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);
        await linkTask(testServer, admin.body.data.accessToken, workspace.body.data.id, lead2.body.data.id, task.body.data.id);
        await linkTask(testServer, member.body.data.accessToken, workspace.body.data.id, lead3.body.data.id, task.body.data.id);

        await unLinkTask(testServer, owner.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);
        await unLinkTask(testServer, admin.body.data.accessToken, workspace.body.data.id, lead2.body.data.id, task.body.data.id);
        await unLinkTask(testServer, member.body.data.accessToken, workspace.body.data.id, lead3.body.data.id, task.body.data.id);
    });

    void it('rejects member unlink task from lead they did not create', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/unlinkTask`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${member.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "You don't have permission to unlink task to this lead");
        assert.equal(parsedBody.code, 'FORBIDDEN');
    });

    void it('rejects viewer from unlinking task', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const viewer = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/unlinkTask`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${viewer.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Forbidden");
        assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('rejects outsider from unlinking task', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const outsider = await registerAndLogin(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/unlinkTask`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${outsider.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Forbidden");
        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('rejects unauthenticated request', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/unlinkTask`, {
            method: 'DELETE',
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Unauthorized");
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('rejects invalid accessToken', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/unlinkTask`, {
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer invalidAccessToken'
            },
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Invalid or expired token");
        assert.equal(parsedBody.code, 'INVALID_TOKEN');
    });

    void it('rejects invalid workspaceId/leadId/taskId', async (t) => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
            taskId: string;
        }> = [
                {
                    title: 'invalid workspace id',
                    workspaceId: 'invalid',
                    leadId: lead.body.data.id,
                    taskId: task.body.data.id
                },
                {
                    title: 'invalid lead id',
                    workspaceId: workspace.body.data.id,
                    leadId: 'invalid',
                    taskId: task.body.data.id
                },
                {
                    title: 'invalid task id',
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    taskId: 'invalid'
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/${testCase.taskId}/unlinkTask`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    },
                });

                assert.equal(res.status, 400);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Invalid request parameters");
                assert.equal(parsedBody.code, 'VALIDATION_ERROR');
            });
        }
    });

    void it('rejects workspace that does not exist', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${randomUUID()}/${lead.body.data.id}/${task.body.data.id}/unlinkTask`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 404);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Workspace not found");
        assert.equal(parsedBody.code, 'WORKSPACE_NOT_FOUND');
    });

    void it('rejects lead that does not exist or not in workspace', async (t) => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace2.body.data.id);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
            taskId: string;
        }> = [
                {
                    title: 'lead does not exist',
                    workspaceId: workspace.body.data.id,
                    leadId: randomUUID(),
                    taskId: task.body.data.id
                },
                {
                    title: 'lead is not in workspace',
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    taskId: task.body.data.id
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/${testCase.taskId}/unlinkTask`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    },
                });

                assert.equal(res.status, 404);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Lead not found");
                assert.equal(parsedBody.code, 'LEAD_NOT_IN_WORKSPACE');
            });
        }
    });

    void it('rejects task that does not exist or not in workspace', async (t) => {
        const { auth, task } = await setupTaskContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace2.body.data.id);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
            taskId: string;
        }> = [
                {
                    title: 'task does not exist',
                    workspaceId: workspace2.body.data.id,
                    leadId: lead.body.data.id,
                    taskId: randomUUID()
                },
                {
                    title: 'task is not in workspace',
                    workspaceId: workspace2.body.data.id,
                    leadId: lead.body.data.id,
                    taskId: task.body.data.id
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/${testCase.taskId}/unlinkTask`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    },
                });

                assert.equal(res.status, 404);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Task not found");
                assert.equal(parsedBody.code, 'TASK_NOT_IN_WORKSPACE');
            });
        }
    });

    void it('rejects unlink when link does not exist', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/unlinkTask`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 404);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Link task not found");
        assert.equal(parsedBody.code, 'NOT_FOUND');
    });
});