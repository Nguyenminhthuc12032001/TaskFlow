import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, registerAndLogin, setupLeadContext, setupTaskContext, setupWorkspaceContext } from "../../helper.js";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeLeadSchema, safeLeadTaskLinkSchema } from "../../../modules/lead/lead.schemas.js";
import { prisma } from "../../../db/prisma.js";
import { ActivityAction, WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe("lead/delete", async () => {
    void it('delete lead as owner', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const successBody = okEnvelopeSchema(safeLeadSchema).parse(body);

        assert.equal(successBody.ok, true);
        assert.equal(successBody.data.id, lead.body.data.id);
        assert.equal(successBody.data.name, lead.body.data.name);
        assert.equal(successBody.data.note, lead.body.data.note);
        assert.equal(successBody.data.email, lead.body.data.email);
        assert.equal(successBody.data.phone, lead.body.data.phone);
        assert.equal(successBody.data.source, lead.body.data.source);
        assert.equal(successBody.data.stage, lead.body.data.stage);
        assert.equal(successBody.data.createdBy, auth.body.data.user.id);
        assert.equal(successBody.data.workspaceId, workspace.body.data.id);
        assert.equal(successBody.data.createdAt instanceof Date, true);
        assert.equal(successBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(successBody.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in successBody.data, false);

        const leadDeleted = await prisma.lead.findUnique({
            where: {
                id: lead.body.data.id
            }
        })

        assert.equal(leadDeleted, null);
    });

    void it('allows to authorized user to delete lead', async (t) => {
        const cases: Array<{
            title: string;
            setup: () => Promise<{
                token: string;
                userId: string;
                workspaceId: string;
                leadId: string;
            }>
        }> = [
                {
                    title: 'member deletes own lead',
                    setup: async () => {
                        const { workspace } = await setupWorkspaceContext(testServer);

                        const member = await registerAndLogin(testServer);
                        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

                        const lead = await createLead(testServer, member.body.data.accessToken, workspace.body.data.id);

                        return {
                            token: member.body.data.accessToken,
                            userId: member.body.data.user.id,
                            workspaceId: workspace.body.data.id,
                            leadId: lead.body.data.id
                        }
                    }
                },
                {
                    title: 'workspace owner deletes lead',
                    setup: async () => {
                        const { auth, workspace } = await setupWorkspaceContext(testServer);

                        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

                        return {
                            token: auth.body.data.accessToken,
                            userId: auth.body.data.user.id,
                            workspaceId: workspace.body.data.id,
                            leadId: lead.body.data.id
                        }
                    }
                },
                {
                    title: 'admin deletes lead',
                    setup: async () => {
                        const { workspace } = await setupWorkspaceContext(testServer);

                        const admin = await registerAndLogin(testServer);
                        await addWorkspaceMember(workspace.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);

                        const lead = await createLead(testServer, admin.body.data.accessToken, workspace.body.data.id);

                        return {
                            token: admin.body.data.accessToken,
                            userId: admin.body.data.user.id,
                            workspaceId: workspace.body.data.id,
                            leadId: lead.body.data.id
                        }
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { token, userId, workspaceId, leadId } = await testCase.setup();

                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspaceId}/${leadId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                assert.equal(res.status, 200);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const successBody = okEnvelopeSchema(safeLeadSchema).parse(body);

                assert.equal(successBody.ok, true);
                assert.equal(successBody.data.id, leadId);
                assert.equal(successBody.data.createdBy, userId);
                assert.equal(successBody.data.workspaceId, workspaceId);
                assert.equal(successBody.data.createdAt instanceof Date, true);
                assert.equal(successBody.data.updatedAt instanceof Date, true);
                assert.equal(Number.isNaN(successBody.data.createdAt.getTime()), false);
            })
        }
    });

    void it('rejects member deleting a lead they do not own', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${member.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, "You don't have permission to delete this lead");
        assert.equal(failBody.code, 'NOT_LEAD_AUTHOR');
    });

    void it('rejects viewer deleting a lead', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const viewer = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${viewer.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, "Forbidden");
        assert.equal(failBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('rejects outsider from deleting lead', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const outsiderWorkspaceContext = await setupWorkspaceContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${outsiderWorkspaceContext.auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, "Forbidden");
        assert.equal(failBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('rejects unauthenticated from deleting lead', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, "Unauthorized");
        assert.equal(failBody.code, 'UNAUTHORIZED');
    });

    void it('invalid parameters id', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
        }> = [
                {
                    title: 'invalid workspace id',
                },
                {
                    title: 'invalid lead id',
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                let Url: string;
                if (testCase.title === 'invalid workspace id') {
                    Url = `/api/leads/invalid/${lead.body.data.id}`;
                }
                else {
                    Url = `/api/leads/${workspace.body.data.id}/invalid`;
                }

                const { res, body } = await jsonRequest(testServer, Url, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 400);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const failBody = failEnvelopeSchema.parse(body);

                assert.equal(failBody.ok, false);
                assert.equal(failBody.message, 'Invalid request parameters');
                assert.equal(failBody.code, 'VALIDATION_ERROR');
            })
        }
    });

    void it('rejects when parameters id does not exist', async (t) => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const leadContext = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
        }> = [
                {
                    title: 'workspace does not exist',
                    workspaceId: `${randomUUID()}`,
                    leadId: `${randomUUID()}`,
                },
                {
                    title: 'lead does not exist',
                    workspaceId: workspace.body.data.id,
                    leadId: `${randomUUID()}`,
                },
                {
                    title: 'lead does not exist in workspace',
                    workspaceId: workspace.body.data.id,
                    leadId: leadContext.lead.body.data.id,
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 404);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const failBody = failEnvelopeSchema.parse(body);

                assert.equal(failBody.ok, false);
                if (testCase.title === 'workspace does not exist') {
                    assert.equal(failBody.message, 'Workspace not found');
                    assert.equal(failBody.code, 'WORKSPACE_NOT_FOUND');
                }
                if (testCase.title === 'lead does not exist') {
                    assert.equal(failBody.message, 'Lead not found');
                    assert.equal(failBody.code, 'LEAD_NOT_IN_WORKSPACE');
                }
                if (testCase.title === 'lead does not exist in workspace') {
                    assert.equal(failBody.message, 'Lead not found');
                    assert.equal(failBody.code, 'LEAD_NOT_IN_WORKSPACE');
                }
            })
        }
    });

    // delete with body strange field
    void it('rejects when deleting lead with strange field', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const payload = {
            [randomUUID()]: randomUUID()
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Invalid request body');
        assert.equal(failBody.code, 'VALIDATION_ERROR');
    });

    void it('delete lead and leadTaskLink', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const linkTask = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/${task.body.data.id}/linkTask`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        })

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(linkTask.res.status, 201);
        assert.match(linkTask.res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(linkTask.body);

        const parsedBody = createdEnvelopeSchema(safeLeadTaskLinkSchema).parse(linkTask.body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.leadId, lead.body.data.id);
        assert.equal(parsedBody.data.taskId, task.body.data.id);

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const successBody = okEnvelopeSchema(safeLeadSchema).parse(body);

        assert.equal(successBody.ok, true);
        assert.equal(successBody.data.id, lead.body.data.id);
        assert.equal(successBody.data.name, lead.body.data.name);
        assert.equal(successBody.data.note, lead.body.data.note);
        assert.equal(successBody.data.email, lead.body.data.email);
        assert.equal(successBody.data.phone, lead.body.data.phone);
        assert.equal(successBody.data.source, lead.body.data.source);
        assert.equal(successBody.data.stage, lead.body.data.stage);
        assert.equal(successBody.data.createdBy, auth.body.data.user.id);
        assert.equal(successBody.data.workspaceId, workspace.body.data.id);
        assert.equal(successBody.data.createdAt instanceof Date, true);
        assert.equal(successBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(successBody.data.createdAt.getTime()), false);
        assert.equal(Number.isNaN(successBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in successBody.data, false);

        const leadTaskLink = await prisma.leadTaskLink.findMany({ where: { leadId: lead.body.data.id } });
        assert.equal(leadTaskLink.length, 0);
    });

    void it('delete successfully create only one activity log', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const successBody = okEnvelopeSchema(safeLeadSchema).parse(body);

        assert.equal(successBody.ok, true);
        assert.equal(successBody.data.id, lead.body.data.id);
        assert.equal(successBody.data.name, lead.body.data.name);
        assert.equal(successBody.data.note, lead.body.data.note);
        assert.equal(successBody.data.email, lead.body.data.email);
        assert.equal(successBody.data.phone, lead.body.data.phone);
        assert.equal(successBody.data.source, lead.body.data.source);
        assert.equal(successBody.data.stage, lead.body.data.stage);
        assert.equal(successBody.data.createdBy, auth.body.data.user.id);
        assert.equal(successBody.data.workspaceId, workspace.body.data.id);
        assert.equal(successBody.data.createdAt instanceof Date, true);
        assert.equal(successBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(successBody.data.createdAt.getTime()), false);
        assert.equal(Number.isNaN(successBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in successBody.data, false);

        const activityLogs = await prisma.activityLog.findMany({ where: { entityId: lead.body.data.id, action: ActivityAction.REMOVE_LEAD } });
        assert.equal(activityLogs.length, 1);

        const activityLog = activityLogs[0];
        assert.ok(activityLog);
        assert.equal(activityLog.workspaceId, workspace.body.data.id);
        assert.equal(activityLog.actorId, auth.body.data.user.id);
        assert.equal(activityLog.action, ActivityAction.REMOVE_LEAD);
        assert.equal(activityLog.entityType, 'lead');
        assert.equal(activityLog.entityId, lead.body.data.id);
        assert.equal(activityLog.createdAt instanceof Date, true);
        assert.equal(typeof activityLog.meta, 'string');

        const meta = JSON.parse(activityLog.meta as string); 

        assert.equal(meta.lead.id, lead.body.data.id);
        assert.equal(meta.lead.name, lead.body.data.name);
        assert.equal(meta.lead.note, lead.body.data.note);
        assert.equal(meta.lead.email, lead.body.data.email);
        assert.equal(meta.lead.phone, lead.body.data.phone);
        assert.equal(meta.lead.source, lead.body.data.source);
        assert.equal(meta.lead.stage, lead.body.data.stage);
        assert.equal(meta.lead.createdBy, auth.body.data.user.id);
        assert.equal(meta.lead.workspaceId, workspace.body.data.id);
        assert.equal(meta.lead.createdAt, successBody.data.createdAt.toISOString());
        assert.equal(meta.lead.updatedAt, successBody.data.updatedAt.toISOString()); 
    });
    
    void it('delete lead fail and not create activity log', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Unauthorized');
        assert.equal(failBody.code, 'UNAUTHORIZED');

        const activityLogs = await prisma.activityLog.findMany({ where: { entityId: lead.body.data.id, action: ActivityAction.REMOVE_LEAD } });
        assert.equal(activityLogs.length, 0);
    });
});