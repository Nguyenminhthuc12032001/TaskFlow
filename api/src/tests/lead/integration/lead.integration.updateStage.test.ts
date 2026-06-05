import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, createWorkspace, linkTask, registerAndLogin, setupLeadContext, setupTaskContext, setupWorkspaceContext } from "../../helper.js";
import { ActivityAction, LeadStage, WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { safeLeadSchema, type UpdateStageBodyType } from "../../../modules/lead/lead.schemas.js";
import assert from "node:assert";
import { failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { randomUUID } from "node:crypto";
import { prisma } from "../../../db/prisma.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe("lead/updateStage", async () => {
    void it('update stage success', async (t) => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const owner = auth;

        const admin = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const lead = await createLead(testServer, member.body.data.accessToken, workspace.body.data.id);

        const cases: Array<{
            title: string;
            accessToken: string;
            workspaceId: string;
            leadId: string;
            payload: UpdateStageBodyType;
        }> = [
                {
                    title: 'member update own lead stage successfully',
                    accessToken: member.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    payload: {
                        stage: LeadStage.contacted
                    }
                },
                {
                    title: 'admin update lead stage successfully',
                    accessToken: admin.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    payload: {
                        stage: LeadStage.qualified
                    }
                },
                {
                    title: 'owner update lead stage successfully',
                    accessToken: owner.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    payload: {
                        stage: LeadStage.lost
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/updateStage`, {
                    method: 'PATCH',
                    body: JSON.stringify(testCase.payload),
                    headers: {
                        Authorization: `Bearer ${testCase.accessToken}`
                    }
                });

                assert.equal(res.status, 200);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = okEnvelopeSchema(safeLeadSchema).parse(body);
                assert.equal(parsedBody.ok, true);
                assert.equal(parsedBody.data.id, testCase.leadId);
                assert.equal(parsedBody.data.workspaceId, testCase.workspaceId);
                assert.equal(parsedBody.data.stage, testCase.payload.stage);
            });
        }
    });

    void it('rejects member updating lead stage they do not own', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
            headers: {
                Authorization: `Bearer ${member.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "You don't have permission to update this lead");
        assert.equal(parsedBody.code, 'FORBIDDEN');
    });

    void it('rejects when viewer updating lead stage', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const viewer = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
            headers: {
                Authorization: `Bearer ${viewer.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('rejects when non-workspace member updating lead stage', async (t) => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const ownerWorkspace2 = await registerAndLogin(testServer);
        const workspace2 = await createWorkspace(testServer, ownerWorkspace2.body.data.accessToken);
        const admin = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace2.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);

        const cases: Array<{
            title: string;
            accessToken: string;
            workspaceId: string;
            leadId: string;
            payload: UpdateStageBodyType;
        }> = [
                {
                    title: 'owner of another workspace update lead stage fails',
                    accessToken: ownerWorkspace2.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    payload: {
                        stage: LeadStage.qualified
                    }
                },
                {
                    title: 'non-workspace admin update lead stage fails',
                    accessToken: admin.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    payload: {
                        stage: LeadStage.qualified
                    }
                },
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/updateStage`, {
                    method: 'PATCH',
                    body: JSON.stringify(testCase.payload),
                    headers: {
                        Authorization: `Bearer ${testCase.accessToken}`
                    }
                });

                assert.equal(res.status, 403);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Forbidden");
                assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
            })
        }
    });

    void it('rejects when unauthenticated user updating lead stage', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
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
        const { workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
            headers: {
                Authorization: 'Bearer invalid'
            },
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid or expired token');
        assert.equal(parsedBody.code, 'INVALID_TOKEN');
    });

    void it('rejects invalid parameters id', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
            payload: UpdateStageBodyType;
        }> = [
                {
                    title: 'invalid workspace id',
                    workspaceId: 'invalid',
                    leadId: lead.body.data.id,
                    payload: {
                        stage: LeadStage.qualified
                    }
                },
                {
                    title: 'invalid lead id',
                    workspaceId: workspace.body.data.id,
                    leadId: 'invalid',
                    payload: {
                        stage: LeadStage.qualified
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/updateStage`, {
                    method: 'PATCH',
                    body: JSON.stringify(testCase.payload),
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
            });
        }
    });

    void it('rejects when workspace/lead does not exist', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
            payload: UpdateStageBodyType;
        }> = [
                {
                    title: 'workspace does not exist',
                    workspaceId: `${randomUUID()}`,
                    leadId: lead.body.data.id,
                    payload: {
                        stage: LeadStage.qualified
                    }
                },
                {
                    title: 'lead does not exist',
                    workspaceId: workspace.body.data.id,
                    leadId: `${randomUUID()}`,
                    payload: {
                        stage: LeadStage.qualified
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}/updateStage`, {
                    method: 'PATCH',
                    body: JSON.stringify(testCase.payload),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 404);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                if (testCase.title.includes('workspace')) {
                    assert.equal(parsedBody.message, "Workspace not found");
                    assert.equal(parsedBody.code, 'WORKSPACE_NOT_FOUND');
                } else {
                    assert.equal(parsedBody.message, "Lead not found");
                    assert.equal(parsedBody.code, 'LEAD_NOT_IN_WORKSPACE');
                }
            });
        }
    });

    void it('rejects when lead from another workspace', async () => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);
        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace2.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead2.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
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
    });

    void it('rejects when request body missing stage', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({}),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Invalid request body");
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('rejects when request body stage is invalid', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            stage: string | null;
        }> = [
                {
                    title: 'invalid stage',
                    stage: 'invalid'
                },
                {
                    title: 'null stage',
                    stage: null
                }
            ]

        for (const testCaes of cases) {
            await t.test(testCaes.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        stage: testCaes.stage
                    }),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 400);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Invalid request body");
                assert.equal(parsedBody.code, 'VALIDATION_ERROR');
            })
        }
    });

    void it('rejects when extra body fields', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified,
                extra: 'extra'
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, "Invalid request body");
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('allows when stage not same old stage', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            stage: LeadStage;
        }> = Object.values(LeadStage).filter(stage => stage !== lead.body.data.stage).map(stage => ({
            title: `update lead stage to ${stage} successfully`,
            stage
        }))

        for (const testCaes of cases) {
            await t.test(testCaes.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        stage: testCaes.stage
                    }),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 200);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = okEnvelopeSchema(safeLeadSchema).parse(body);
                assert.equal(parsedBody.ok, true);
                assert.equal(parsedBody.data.stage, testCaes.stage);
            })
        }
    });

    void it('database pesists the new stage', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.stage, LeadStage.qualified);

        const updatedLead = await prisma.lead.findUnique({
            where: {
                id: lead.body.data.id
            }
        });

        assert.ok(updatedLead);
        assert.equal(updatedLead.stage, LeadStage.qualified);
    });

    void it('does not change other lead fields', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadSchema).parse(body);
        assert.equal(parsedBody.ok, true);

        lead.body.data.updatedAt = parsedBody.data.updatedAt;
        lead.body.data.stage = LeadStage.qualified;

        assert.deepEqual(parsedBody.data, lead.body.data);
    });

    void it('changes updatedAt after update', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.ok(parsedBody.data.updatedAt > lead.body.data.updatedAt);
    });

    void it('creates exactly one UPDATE_LEAD_STAGE activity log', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadSchema).parse(body);
        assert.equal(parsedBody.ok, true);

        const activityLogs = await prisma.activityLog.findMany({
            where: {
                entityId: lead.body.data.id,
                workspaceId: workspace.body.data.id,
                actorId: auth.body.data.user.id,
                action: ActivityAction.UPDATE_LEAD_STAGE,
                entityType: 'lead',
            }
        });
        assert.equal(activityLogs.length, 1);
    });

    void it('updates lead stage fail does not create activity log', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: 'invalid'
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, "Invalid request body");
        assert.equal(failBody.code, 'VALIDATION_ERROR');

        const activityLogs = await prisma.activityLog.findMany({
            where: {
                entityId: lead.body.data.id,
                workspaceId: workspace.body.data.id,
                actorId: auth.body.data.user.id,
                action: ActivityAction.UPDATE_LEAD_STAGE,
                entityType: 'lead',
            }
        });
        assert.equal(activityLogs.length, 0);
    });

    void it('updates lead stage fail does not change updatedAt and stage', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: 'invalid'
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const leadAfterUpdateFail = await prisma.lead.findUnique({
            where: {
                id: lead.body.data.id
            }
        });

        assert.ok(leadAfterUpdateFail);
        assert.equal(leadAfterUpdateFail.updatedAt.toISOString(), lead.body.data.updatedAt.toISOString());
        assert.equal(leadAfterUpdateFail.stage, lead.body.data.stage);
    });

    void it('rejects updates same current stage', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: lead.body.data.stage
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, "You cannot update to the same stage");
        assert.equal(failBody.code, 'BAD_REQUEST');
    });

    void it('unchanged linked task after updated', async () => {
        const { auth, workspace, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}/updateStage`, {
            method: 'PATCH',
            body: JSON.stringify({
                stage: LeadStage.qualified
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadSchema).parse(body);
        assert.equal(parsedBody.ok, true);

        const taskLinks = await prisma.leadTaskLink.findMany({
            where: {
                leadId: lead.body.data.id,
                taskId: task.body.data.id
            }
        });

        assert.equal(taskLinks.length, 1);
    });
});