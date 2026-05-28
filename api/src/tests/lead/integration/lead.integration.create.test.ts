import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, createWorkspace, registerAndLogin, setupLeadContext, setupWorkspaceContext } from "../../helper.js";
import { safeLeadSchema, type CreateBodyType } from "../../../modules/lead/lead.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema } from "../../../common/utils/response/format.js";
import { ActivityAction, LeadStage, WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { prisma } from "../../../db/prisma.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe("lead/create", async () => {
    void it('create lead as owner with full payload', async () => {
        await setupLeadContext(testServer);
    });

    void it('create lead with required fields only', async () => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const payload: CreateBodyType = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 201);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = createdEnvelopeSchema(safeLeadSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.created, true);
        assert.equal(typeof parsedBody.data.id, 'string');
        assert.equal(parsedBody.data.name, payload.name);
        assert.equal(parsedBody.data.note, payload.note);
        assert.equal(parsedBody.data.email, payload.email);
        assert.equal(parsedBody.data.phone, payload.phone);
        assert.equal(parsedBody.data.source, payload.source);
        assert.equal(parsedBody.data.stage, LeadStage.new);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);

        assert.equal('deletedAt' in parsedBody.data, false);
    });

    void it('allows member and admin to create lead', async () => {
        const { workspace } = await setupWorkspaceContext(testServer);

        const admin = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        await createLead(testServer, admin.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, member.body.data.accessToken, workspace.body.data.id);
    });

    void it('reject unauthenticated request', async () => {
        const { workspace } = await setupWorkspaceContext(testServer);

        const payload = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`
        }

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Unauthorized');
        assert.equal(failBody.code, 'UNAUTHORIZED');
    });

    void it('reject outsider from creating lead', async () => {
        const { workspace } = await setupWorkspaceContext(testServer);

        const outsider = await registerAndLogin(testServer);

        const payload = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`
        }

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${outsider.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject viewer from creating lead', async () => {
        const { workspace } = await setupWorkspaceContext(testServer);

        const viewer = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const payload = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`
        }

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${viewer.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject missing required fields', async () => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const payload = {
            note: `Test note ${randomUUID()}`
        }

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'POST',
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

    void it('reject invalid text length after trimming', async (t) => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const payload: CreateBodyType = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`,
            source: `Test source ${randomUUID()}`,
        }

        const cases: Array<{
            title: string;
            payload: CreateBodyType;
        }> = [
                {
                    title: 'reject empty name after trimming',
                    payload: {
                        ...payload,
                        name: '   '
                    }
                },
                {
                    title: 'reject empty note after trimming',
                    payload: {
                        ...payload,
                        note: '   '
                    }
                },
                {
                    title: 'reject empty source after trimming',
                    payload: {
                        ...payload,
                        source: '   '
                    }
                },
                {
                    title: 'reject name exceeding maximum length',
                    payload: {
                        ...payload,
                        name: 'a'.repeat(101)
                    }
                },
                {
                    title: 'reject note exceeding maximum length',
                    payload: {
                        ...payload,
                        note: 'a'.repeat(201)
                    }
                },
                {
                    title: 'reject source exceeding maximum length',
                    payload: {
                        ...payload,
                        source: 'a'.repeat(101)
                    }
                },
                {
                    title: 'reject too short name',
                    payload: {
                        ...payload,
                        name: 'a'.repeat(4)
                    }
                },
                {
                    title: 'reject too short note',
                    payload: {
                        ...payload,
                        note: 'a'.repeat(4)
                    }
                },
                {
                    title: 'reject too short source',
                    payload: {
                        ...payload,
                        source: 'a'.repeat(9)
                    }
                },
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
                    method: 'POST',
                    body: JSON.stringify(testCase.payload),
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
            })
        }
    })

    void it('reject invalid email', async () => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const payload = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`,
            email: 'not-an-email'
        }

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'POST',
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

    void it('accept boundary exactly content length', async (t) => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const payload = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`,
        }

        const cases: Array<{
            title: string;
            payload: CreateBodyType;
        }> = [
                {
                    title: 'accept name exactly maximum content length',
                    payload: {
                        ...payload,
                        name: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept note exactly maximum content length',
                    payload: {
                        ...payload,
                        note: 'a'.repeat(200)
                    }
                },
                {
                    title: 'accept source exactly maximum content length',
                    payload: {
                        ...payload,
                        source: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept name exactly minimum content length',
                    payload: {
                        ...payload,
                        name: 'a'.repeat(5)
                    }
                },
                {
                    title: 'accept note exactly minimum content length',
                    payload: {
                        ...payload,
                        note: 'a'.repeat(5)
                    }
                },
                {
                    title: 'accept source exactly minimum content length',
                    payload: {
                        ...payload,
                        source: 'a'.repeat(10)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
                    method: 'POST',
                    body: JSON.stringify(testCase.payload),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 201);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = createdEnvelopeSchema(safeLeadSchema).parse(body);

                assert.equal(parsedBody.ok, true);
                assert.equal(parsedBody.created, true);
                assert.equal(typeof parsedBody.data.id, 'string');
                assert.equal(parsedBody.data.name, testCase.payload.name);
                assert.equal(parsedBody.data.note, testCase.payload.note);
                assert.equal(parsedBody.data.source, testCase.payload.source);
                assert.equal(parsedBody.data.createdAt instanceof Date, true);
                assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
                assert.equal('deletedAt' in parsedBody.data, false);
                assert.equal('updatedAt' in parsedBody.data, true);
            })
        }
    });

    void it('reject duplicate email and phone in same workspace', async (t) => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const createLeadRes = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const payload: CreateBodyType = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`,
        };

        const cases: Array<{
            title: string;
            payload: CreateBodyType;
        }> = [
                {
                    title: 'reject duplicate email',
                    payload: {
                        ...payload,
                        email: createLeadRes.body.data.email
                    }
                },
                {
                    title: 'reject duplicate phone',
                    payload: {
                        ...payload,
                        phone: createLeadRes.body.data.phone
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
                    method: 'POST',
                    body: JSON.stringify(testCase.payload),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 409);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const failBody = failEnvelopeSchema.parse(body);

                assert.equal(failBody.ok, false);
                if (testCase.title === 'reject duplicate email') {
                    assert.equal(failBody.message, 'Duplicate email is not allowed');
                    assert.equal(failBody.code, 'DUPLICATE_EMAIL');
                }

                if (testCase.title === 'reject duplicate phone') {
                    assert.equal(failBody.message, 'Duplicate phone is not allowed');
                    assert.equal(failBody.code, 'DUPLICATE_PHONE');
                }
            })
        }
    });

    void it('allow same email and phone in different workspace', async (t) => {
        const { auth, lead } = await setupLeadContext(testServer);

        const payload: CreateBodyType = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`,
        };

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);

        const cases: Array<{
            title: string;
            payload: CreateBodyType;
            workspaceId: string;
        }> = [
                {
                    title: 'allow same email in different workspace',
                    payload: {
                        ...payload,
                        email: lead.body.data.email
                    },
                    workspaceId: workspace2.body.data.id
                },
                {
                    title: 'allow same phone in different workspace',
                    payload: {
                        ...payload,
                        phone: lead.body.data.phone
                    },
                    workspaceId: workspace2.body.data.id
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}`, {
                    method: 'POST',
                    body: JSON.stringify(testCase.payload),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 201);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = createdEnvelopeSchema(safeLeadSchema).parse(body);

                assert.equal(parsedBody.ok, true);
                assert.equal(parsedBody.created, true);
                assert.equal(typeof parsedBody.data.id, 'string');
                assert.equal(parsedBody.data.name, testCase.payload.name);
                assert.equal(parsedBody.data.note, testCase.payload.note);
                assert.equal(parsedBody.data.source, testCase.payload.source);
                assert.equal(parsedBody.data.createdAt instanceof Date, true);
                assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
                assert.equal('deletedAt' in parsedBody.data, false);
                assert.equal('updatedAt' in parsedBody.data, true);
            })
        }
    });

    void it('create activity log after lead creation', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const activityLogs = await prisma.activityLog.findMany({
            where: {
                entityId: lead.body.data.id,
                workspaceId: workspace.body.data.id,
                actorId: auth.body.data.user.id,
                action: ActivityAction.CREATE_LEAD,
                entityType: 'lead',
                deletedAt: null,
            }
        })

        assert.equal(activityLogs.length, 1);

        const activityLog = activityLogs[0];
        assert.ok(activityLog);
        assert.equal(activityLog.workspaceId, workspace.body.data.id);
        assert.equal(activityLog.actorId, auth.body.data.user.id);
        assert.equal(activityLog.action, ActivityAction.CREATE_LEAD);
        assert.equal(activityLog.entityType, 'lead');
        assert.equal(activityLog.entityId, lead.body.data.id);
        assert.equal(activityLog.createdAt instanceof Date, true);
        assert.equal(typeof activityLog.meta, 'string');

        const meta = JSON.parse(activityLog.meta as string);
        assert.deepEqual(meta.lead, {
            id: lead.body.data.id,
            name: lead.body.data.name,
            note: lead.body.data.note,
            source: lead.body.data.source,
            stage: lead.body.data.stage,
            email: lead.body.data.email,
            phone: lead.body.data.phone,
            workspaceId: lead.body.data.workspaceId,
            createdBy: lead.body.data.createdBy,
            createdAt: lead.body.data.createdAt.toISOString(),
            updatedAt: lead.body.data.updatedAt.toISOString(),
            deletedAt: null
        });

    });

    void it('does not create lead or activity log on validation failure', async (t) => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const payload: CreateBodyType = {
            name: `     `,
            note: `Test note ${randomUUID()}`,
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'POST',
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

        await t.test('lead is not created', async () => {
            const leads = await prisma.lead.findMany({
                where: {
                    workspaceId: workspace.body.data.id,
                }
            });

            assert.equal(leads.length, 0);
        })

        await t.test('activity log is not created', async () => {
            const activityLogs = await prisma.activityLog.findMany({
                where: {
                    workspaceId: workspace.body.data.id,
                }
            });

            assert.equal(activityLogs.length, 1);
        })
    })

    void it('does not create lead or activity log on validation failure', async (t) => {
        const { workspace } = await setupWorkspaceContext(testServer);

        const payload: CreateBodyType = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`,
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Unauthorized');
        assert.equal(failBody.code, 'UNAUTHORIZED');

        await t.test('lead is not created', async () => {
            const leads = await prisma.lead.findMany({
                where: {
                    workspaceId: workspace.body.data.id,
                }
            });

            assert.equal(leads.length, 0);
        })

        await t.test('activity log is not created', async () => {
            const activityLogs = await prisma.activityLog.findMany({
                where: {
                    workspaceId: workspace.body.data.id,
                }
            });

            assert.equal(activityLogs.length, 1);
        })
    });

    void it('return 404 when workspace does not exist', async () => {
        const auth = await registerAndLogin(testServer);

        const payload: CreateBodyType = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`,
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/${randomUUID()}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 404);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Workspace not found');
        assert.equal(failBody.code, 'WORKSPACE_NOT_FOUND');
    });

    void it('return 400 when workspaceId is invalid', async () => {
        const auth = await registerAndLogin(testServer);

        const payload: CreateBodyType = {
            name: `Test lead ${randomUUID()}`,
            note: `Test note ${randomUUID()}`,
        };

        const { res, body } = await jsonRequest(testServer, `/api/leads/invalid-id`, {
            method: 'POST',
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
        assert.equal(failBody.message, 'Invalid request parameters');
        assert.equal(failBody.code, 'VALIDATION_ERROR');
    });
});