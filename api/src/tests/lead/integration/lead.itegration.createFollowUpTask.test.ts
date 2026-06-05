import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, registerAndLogin, setupTaskContext } from "../../helper.js";
import { safeLeadDetailSchema, safeLeadTaskLinkSchema, type CreateFollowUpBodyType } from "../../../modules/lead/lead.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { prisma } from "../../../db/prisma.js";
import { ActivityAction, TaskPriority, WorkspaceRole } from "../../../../prisma/generated/enums.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe("lead/createFollowUpTask", async () => {
    void it('creates follow up task successfully', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const dueDate: Date = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        const payload: CreateFollowUpBodyType = {
            title: `Test Task ${randomUUID()}`,
            description: `Test Task ${randomUUID()}`,
            priority: TaskPriority.low,
            dueDate,
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.leadId, lead.body.data.id);
        const activityLogs = await prisma.activityLog.findMany({
            where: {
                action: ActivityAction.CREATE_FOLLOWUP_TASK,
                workspaceId: workspace.body.data.id,
                actorId: auth.body.data.user.id,
                entityType: 'task',
            }
        })

        assert.equal(activityLogs.length, 1);
        assert.equal(activityLogs[0].entityId, parsedBody.data.taskId);
    });

    void it('creates task row and lead task link row', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const dueDate: Date = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        const payload: CreateFollowUpBodyType = {
            title: `Test Task ${randomUUID()}`,
            description: `Test Task ${randomUUID()}`,
            priority: TaskPriority.low,
            dueDate,
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.leadId, lead.body.data.id);

        const task = await prisma.task.findUnique({
            where: {
                id: parsedBody.data.taskId
            }
        });

        const leadTaskLink = await prisma.leadTaskLink.findUnique({
            where: {
                leadId_taskId: {
                    leadId: lead.body.data.id,
                    taskId: parsedBody.data.taskId
                }
            }
        });

        assert.ok(task);
        assert.ok(leadTaskLink);
    });

    void it('creates follow up task with required title only', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const payload: CreateFollowUpBodyType = {
            title: `Test Task ${randomUUID()}`,
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.leadId, lead.body.data.id);

        const task = await prisma.task.findUnique({
            where: {
                id: parsedBody.data.taskId
            }
        });

        assert.ok(task);

        assert.equal(task.title, payload.title);
        assert.equal(task.description, null);
        assert.equal(task.priority, TaskPriority.medium);
        assert.equal(task.dueDate, null);
    });

    void it('sets task projectId, columnId, createdBy, title, description, priority, dueDate verify db task matches request and actor', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const dueDate: Date = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        const payload: CreateFollowUpBodyType = {
            title: `Test Task ${randomUUID()}`,
            description: `Test Task ${randomUUID()}`,
            priority: TaskPriority.low,
            dueDate,
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.leadId, lead.body.data.id);

        const task = await prisma.task.findUnique({
            where: {
                id: parsedBody.data.taskId
            }
        });

        assert.ok(task);
        assert.equal(task.projectId, project.body.data.id);
        assert.equal(task.columnId, columnId);
        assert.equal(task.createdBy, auth.body.data.user.id);
        assert.equal(task.title, payload.title);
        assert.equal(task.description, payload.description);
        assert.equal(task.priority, payload.priority);
        assert.equal(task.dueDate?.toISOString(), payload.dueDate?.toISOString());
    });

    void it('sets position to max position + 1000', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const payload: CreateFollowUpBodyType = {
            title: `Test Task ${randomUUID()}`,
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.leadId, lead.body.data.id);

        const tasks = await prisma.task.findMany({
            where: {
                columnId,
                projectId: project.body.data.id,
                createdBy: auth.body.data.user.id
            },
        });

        assert.equal(tasks.length, 2);
        assert.equal(Math.max(...tasks.map(t => t.position)), Math.min(...tasks.map(t => t.position)) + 1000);
    });

    void it('after create, GET lead inlcudes task in taskLinks', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const payload: CreateFollowUpBodyType = {
            title: `Test Task ${randomUUID()}`,
        };

        const { res: createRes, body: createBody } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(createRes.status, 201);
        assert.match(createRes.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(createRes.ok);

        const parsedCreateBody = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(createBody);

        assert.equal(parsedCreateBody.ok, true);
        assert.equal(parsedCreateBody.data.leadId, lead.body.data.id);

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
        assert.ok(parsedBody.data.taskLinks.some(t => t.title === payload.title && t.id === parsedCreateBody.data.taskId && t.projectId === project.body.data.id && t.columnId === columnId && t.createdBy === auth.body.data.user.id));
    });

    void it('creates one CREATE_FOLLOWUP_TASK activity log', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const payload: CreateFollowUpBodyType = {
            title: `Test Task ${randomUUID()}`,
        };

        const { res: createRes, body: createBody } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(createRes.status, 201);
        assert.match(createRes.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(createRes.ok);

        const parsedCreateBody = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(createBody);

        assert.equal(parsedCreateBody.ok, true);
        assert.equal(parsedCreateBody.data.leadId, lead.body.data.id);

        const activityLogs = await prisma.activityLog.findMany({
            where: {
                entityId: parsedCreateBody.data.taskId,
                workspaceId: workspace.body.data.id,
                actorId: auth.body.data.user.id,
                action: ActivityAction.CREATE_FOLLOWUP_TASK,
                entityType: 'task',
            }
        })
        assert.equal(activityLogs.length, 1);
    });

    void it('does not creates task/link/activity log on body validation failure', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const payload: CreateFollowUpBodyType = {
            title: '',
        };

        const { res: createRes, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.equal(createRes.status, 400);
        assert.match(createRes.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const activityLogs = await prisma.activityLog.findMany({
            where: {
                entityId: lead.body.data.id,
                workspaceId: workspace.body.data.id,
                actorId: auth.body.data.user.id,
                action: ActivityAction.CREATE_FOLLOWUP_TASK,
                entityType: 'task',
            }
        })
        assert.equal(activityLogs.length, 0);
    });

    void it('allows workspace owner/admin/member (member if they created the lead) to create follow up task', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const owner = auth;

        const admin = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const lead = await createLead(testServer, member.body.data.accessToken, workspace.body.data.id);

        const cases: Array<{
            title: string;
            accessToken: string;
            payload: CreateFollowUpBodyType;
        }> = [
                {
                    title: 'owner create follow up task',
                    accessToken: owner.body.data.accessToken,
                    payload: { title: `Test Task ${randomUUID()}` }
                },
                {
                    title: 'admin create follow up task',
                    accessToken: admin.body.data.accessToken,
                    payload: { title: `Test Task ${randomUUID()}` }
                },
                {
                    title: 'member create follow up task',
                    accessToken: member.body.data.accessToken,
                    payload: { title: `Test Task ${randomUUID()}` }
                }
            ];

        for (const testCase of cases) {
            const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${testCase.accessToken}`
                },
                body: JSON.stringify(testCase.payload)
            });

            assert.equal(res.status, 201);
            assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
            assert.ok(res.ok);

            const parsedBody = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(body);

            assert.equal(parsedBody.ok, true);
            assert.equal(parsedBody.data.leadId, lead.body.data.id);
        }
    });

    void it('rejects member to create follow up task on lead they did not create', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${member.body.data.accessToken}`
            },
            body: JSON.stringify({ title: `Test Task ${randomUUID()}` })
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "You don't have permission to create follow up task");
        assert.equal(parsedBody.code, 'FORBIDDEN');
    });

    void it('rejects viewer/outsider to create follow up task', async (t) => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const outsider = await registerAndLogin(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const viewer = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const cases: Array<{
            title: string;
            accessToken: string;
            payload: CreateFollowUpBodyType;
        }> = [
                {
                    title: 'viewer create follow up task',
                    accessToken: viewer.body.data.accessToken,
                    payload: { title: `Test Task ${randomUUID()}` }
                },
                {
                    title: 'outsider create follow up task',
                    accessToken: outsider.body.data.accessToken,
                    payload: { title: `Test Task ${randomUUID()}` }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${testCase.accessToken}`
                    },
                    body: JSON.stringify(testCase.payload)
                });

                assert.equal(res.status, 403);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                if (testCase.title === 'viewer create follow up task') {
                    assert.equal(parsedBody.message, "Forbidden");
                    assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
                } else {
                    assert.equal(parsedBody.message, "Forbidden");
                    assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
                }
            })
        }
    });

    void it('rejects unauthenticated request', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify({ title: `Test Task ${randomUUID()}` })
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('rejects invalid accessToken', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer invalidAccessToken'
            },
            body: JSON.stringify({ title: `Test Task ${randomUUID()}` })
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid or expired token');
        assert.equal(parsedBody.code, 'INVALID_TOKEN');
    });

    void it('rejects invalid params id', async (t) => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const cases: Array<{
            title: string;
            workspaceId: string;
            projectId: string;
            columnId: string;
            leadId: string;
            payload: CreateFollowUpBodyType;
        }> = [
                {
                    title: 'invalid workspace id',
                    workspaceId: 'invalid',
                    projectId: project.body.data.id,
                    columnId: columnId,
                    leadId: lead.body.data.id,
                    payload: { title: `Test Task ${randomUUID()}` }
                },
                {
                    title: 'invalid project id',
                    workspaceId: workspace.body.data.id,
                    projectId: 'invalid',
                    columnId: columnId,
                    leadId: lead.body.data.id,
                    payload: { title: `Test Task ${randomUUID()}` }
                },
                {
                    title: 'invalid column id',
                    workspaceId: workspace.body.data.id,
                    projectId: project.body.data.id,
                    columnId: 'invalid',
                    leadId: lead.body.data.id,
                    payload: { title: `Test Task ${randomUUID()}` }
                },
                {
                    title: 'invalid lead id',
                    workspaceId: workspace.body.data.id,
                    projectId: project.body.data.id,
                    columnId: columnId,
                    leadId: 'invalid',
                    payload: { title: `Test Task ${randomUUID()}` }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.projectId}/${testCase.columnId}/${testCase.leadId}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    },
                    body: JSON.stringify(testCase.payload)
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

    void it('rejects when workspace/project/column/lead does not exist', async (t) => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const cases: Array<{
            title: string;
            workspaceId: string;
            projectId: string;
            columnId: string;
            leadId: string;
            payload: CreateFollowUpBodyType;
        }> = [
                {
                    title: 'workspace id does not exist',
                    workspaceId: `${randomUUID()}`,
                    projectId: project.body.data.id,
                    columnId: columnId,
                    leadId: lead.body.data.id,
                    payload: { title: `Test Task ${randomUUID()}` }
                },
                {
                    title: 'project id does not exist',
                    workspaceId: workspace.body.data.id,
                    projectId: `${randomUUID()}`,
                    columnId: columnId,
                    leadId: lead.body.data.id,
                    payload: { title: `Test Task ${randomUUID()}` }
                },
                {
                    title: 'column id does not exist',
                    workspaceId: workspace.body.data.id,
                    projectId: project.body.data.id,
                    columnId: `${randomUUID()}`,
                    leadId: lead.body.data.id,
                    payload: { title: `Test Task ${randomUUID()}` }
                },
                {
                    title: 'lead id does not exist',
                    workspaceId: workspace.body.data.id,
                    projectId: project.body.data.id,
                    columnId: columnId,
                    leadId: `${randomUUID()}`,
                    payload: { title: `Test Task ${randomUUID()}` }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.projectId}/${testCase.columnId}/${testCase.leadId}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    },
                    body: JSON.stringify(testCase.payload)
                });

                assert.equal(res.status, 404);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                if (testCase.title.includes('workspace')) {
                    assert.equal(parsedBody.message, "Workspace not found");
                    assert.equal(parsedBody.code, 'WORKSPACE_NOT_FOUND');
                } else if (testCase.title.includes('project')) {
                    assert.equal(parsedBody.message, "Project not found");
                    assert.equal(parsedBody.code, 'PROJECT_NOT_IN_WORKSPACE');
                } else if (testCase.title.includes('column')) {
                    assert.equal(parsedBody.message, "Column not found");
                    assert.equal(parsedBody.code, 'COLUMN_NOT_IN_PROJECT');
                } else {
                    assert.equal(parsedBody.message, "Lead not found");
                    assert.equal(parsedBody.code, 'LEAD_NOT_IN_WORKSPACE');
                }
            });
        }
    });

    void it('rejects when request body missing title field', async () => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
            body: JSON.stringify({})
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Invalid request body");
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('rejects when invalid title/description lenght after trim', async (t) => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const cases: Array<{
            title: string;
            payload: CreateFollowUpBodyType;
        }> = [
                {
                    title: 'title too long',
                    payload: { title: 'a'.repeat(101) }
                },
                {
                    title: 'description too long',
                    payload: { title: `Test Task ${randomUUID()}`, description: 'a'.repeat(101) }
                },
                {
                    title: 'title too short',
                    payload: { title: 'a'.repeat(4) }
                },
                {
                    title: 'description too short',
                    payload: { title: `Test Task ${randomUUID()}`, description: 'a'.repeat(9) }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    },
                    body: JSON.stringify(testCase.payload)
                });

                assert.equal(res.status, 400);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Invalid request body");
                assert.equal(parsedBody.code, 'VALIDATION_ERROR');
            });
        }

    });

    void it('rejects invalid priority/dueDate', async (t) => {
        const { auth, workspace, project, columnId } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const cases: Array<{
            title: string;
            payload: {};
        }> = [
                {
                    title: 'invalid priority',
                    payload: { title: `Test Task ${randomUUID()}`, priority: 'invalid' }
                },
                {
                    title: 'invalid dueDate',
                    payload: { title: `Test Task ${randomUUID()}`, dueDate: 'invalid' }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${project.body.data.id}/${columnId}/${lead.body.data.id}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    },
                    body: JSON.stringify(testCase.payload)
                });

                assert.equal(res.status, 400);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Invalid request body");
                assert.equal(parsedBody.code, 'VALIDATION_ERROR');
            });
        }
    })
});
