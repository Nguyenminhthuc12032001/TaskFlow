import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, createProject, createTask, createWorkspace, linkTask, registerAndLogin, setupLeadContext, setupTaskContext, unLinkTask } from "../../helper.js";
import { prisma } from "../../../db/prisma.js";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeLeadDetailSchema } from "../../../modules/lead/lead.schemas.js";
import { ActivityAction, WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";
import { safeColumnSchema } from "../../../modules/column/column.schemas.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('lead/linkTask', async () => {
    void it('link task successfully', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);
    });

    void it('creates exactly one record LeadTaskLink with { leadId: $leadId, taskId: $taskId }', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const leadTaskLinks = await prisma.leadTaskLink.count({ where: { leadId: lead.body.data.id, taskId: task.body.data.id } });

        assert.equal(leadTaskLinks, 1);
    });

    void it('after link, GET /leads/:workspaceId/:leadId response task in taskLinks', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadDetailSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, lead.body.data.id);
        assert.equal(parsedBody.data.taskLinks.length, 1);

        assert.equal(parsedBody.data.taskLinks[0].id, task.body.data.id);
        assert.equal(parsedBody.data.taskLinks[0].projectId, task.body.data.projectId);
        assert.equal(parsedBody.data.taskLinks[0].columnId, task.body.data.columnId);
        assert.equal(parsedBody.data.taskLinks[0].title, task.body.data.title);
        assert.equal(parsedBody.data.taskLinks[0].priority, task.body.data.priority);
        assert.equal(parsedBody.data.taskLinks[0].createdBy, task.body.data.createdBy);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.taskLinks[0].createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.taskLinks[0].updatedAt.getTime()), false);
        assert.equal(parsedBody.data.taskLinks[0].description, task.body.data.description);
        assert.equal(parsedBody.data.taskLinks[0].dueDate?.getDate(), task.body.data.dueDate?.getDate());
        assert.equal(parsedBody.data.taskLinks[0].position, task.body.data.position);

        assert.equal('deletedAt' in parsedBody.data, false);
    });

    void it('allows workspace owner/admin link task to lead', async (t) => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const admin = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const cases: {
            title: string;
            accessToken: string;
            leadId: string;
            taskId: string;
        }[] = [
                { title: 'workspace owner link task to lead', accessToken: auth.body.data.accessToken, leadId: lead.body.data.id, taskId: task.body.data.id },
                { title: 'workspace admin link task to lead', accessToken: admin.body.data.accessToken, leadId: lead2.body.data.id, taskId: task.body.data.id },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                await linkTask(testServer, testCase.accessToken, workspace.body.data.id, testCase.leadId, testCase.taskId);
            });
        }
    });

    void it('allows workspace member link a task to a lead they created', async () => {
        const { workspace, task } = await setupTaskContext(testServer);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const lead = await createLead(testServer, member.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, member.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);
    });

    void it('reject member link a task to a lead they did not create', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${member.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "You don't have permission to link task to this lead");
        assert.equal(parsedBody.code, 'FORBIDDEN');
    });

    void it('reject viewer from linking a task to a lead', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const viewer = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
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

    void it('reject outsider from linking a task to a lead', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const outsider = await registerAndLogin(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
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

    void it('reject unauthenticated user from linking a task to a lead', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Unauthorized");
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('reject invalid accessToken from linking a task to a lead', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer invalid-token`
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

    void it('reject duplicated link', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 409);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Duplicate link task is not allowed");
        assert.equal(parsedBody.code, 'CONFLICT');
    });

    void it('reject invalid parameters request id from linking a task to a lead', async (t) => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
            taskId: string;
        }> = [
                {
                    title: 'invalid lead id',
                    workspaceId: workspace.body.data.id,
                    leadId: 'invalid-id',
                    taskId: task.body.data.id
                },
                {
                    title: 'invalid task id',
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    taskId: 'invalid-id'
                },
                {
                    title: 'invalid workspace id and task id',
                    workspaceId: 'invalid-id',
                    leadId: lead.body.data.id,
                    taskId: task.body.data.id
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/${testCase.taskId}/linkTask`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 400);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Invalid request parameters");
                assert.equal(parsedBody.code, 'VALIDATION_ERROR');
            })
        }
    });

    void it('reject workspace does not exist from linking a task to a lead', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${randomUUID()}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 404);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Workspace not found");
        assert.equal(parsedBody.code, 'WORKSPACE_NOT_FOUND');
    });

    void it('reject lead does not exist or not in workspace from linking a task to a lead', async (t) => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const workspaceOutside = await createWorkspace(testServer, auth.body.data.accessToken);
        const leadOutside = await createLead(testServer, auth.body.data.accessToken, workspaceOutside.body.data.id);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
            taskId: string;
        }> = [
                {
                    title: 'lead does not exist',
                    workspaceId: workspace.body.data.id,
                    leadId: `${randomUUID()}`,
                    taskId: task.body.data.id
                },
                {
                    title: 'lead does not exist in workspace',
                    workspaceId: workspace.body.data.id,
                    leadId: leadOutside.body.data.id,
                    taskId: task.body.data.id
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/${testCase.taskId}/linkTask`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 404);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Lead not found");
                assert.equal(parsedBody.code, 'LEAD_NOT_IN_WORKSPACE');
            })
        }
    });

    void it('reject task does not exist or not in workspace from linking a task to a lead', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const workspaceOutside = await createWorkspace(testServer, auth.body.data.accessToken);
        const projectOutside = await createProject(testServer, auth.body.data.accessToken, workspaceOutside.body.data.id);
        const columnOutside = await prisma.column.create({
            data: {
                projectId: projectOutside.body.data.id,
                name: 'test column',
            }
        })

        assert.ok(columnOutside);
        const taskOutside = await createTask(testServer, auth.body.data.accessToken, workspaceOutside.body.data.id, projectOutside.body.data.id, columnOutside.id);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
            taskId: string;
        }> = [
                {
                    title: 'task does not exist',
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    taskId: `${randomUUID()}`
                },
                {
                    title: 'task does not exist in workspace',
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    taskId: taskOutside.body.data.id
                }
            ]


        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/${testCase.taskId}/linkTask`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 404);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Task not found");
                assert.equal(parsedBody.code, 'TASK_NOT_IN_WORKSPACE');
            })
        }
    });

    void it('reject invalid Json body from linking a task to a lead', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify({
                invalid: 'invalid'
            })
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('create only one activity log with linkTask', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);
        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const activityLogs = await prisma.activityLog.count({ where: { entityId: `${lead.body.data.id}`, action: ActivityAction.LINK_TASK } });

        assert.equal(activityLogs, 1);
    });

    void it('const create LeadTaskLink and activityLog when request failed', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const leadId = randomUUID();

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${leadId}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 404);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Lead not found');
        assert.equal(parsedBody.code, 'LEAD_NOT_IN_WORKSPACE');

        const activityLogs = await prisma.leadTaskLink.count({ where: { leadId, taskId: task.body.data.id } });
        assert.equal(activityLogs, 0);

        const leadTaskLinks = await prisma.activityLog.count({ where: { entityId: `${leadId}` } });
        assert.equal(leadTaskLinks, 0);
    });

    void it('race condition', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);
        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const result1 = jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        const result2 = jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        const results = await Promise.all([result1, result2]);

        assert.equal(results.some((result) => result.res.status === 201), true);
        assert.equal(results.some((result) => result.res.status === 409), true);
        assert.equal(results.every((result) => result.res.status === 201), false);
        assert.equal(results.every((result) => result.res.status === 409), false);
    });

    void it('allows link many tasks to a lead', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);
        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const taskIds: string[] = [];
        for (let i = 0; i < 10; i++) {
            const task = await createTask(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId);
            taskIds.push(task.body.data.id);
        }

        await Promise.all(taskIds.map((taskId) => linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, taskId)));
    });

    void it('allows link task to many leads', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const leadIds: string[] = [];
        for (let i = 0; i < 3; i++) {
            const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
            leadIds.push(lead.body.data.id);
        }

        await Promise.all(leadIds.map((leadId) => linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, leadId, task.body.data.id)));
    });

    void it('allows relink after unlink', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);
        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        await unLinkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);
    });
});