import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, createWorkspace, registerAndLogin, setupLeadContext, uniqueEmail, uniquePhoneNumber } from "../../helper.js";
import { safeLeadSchema, type UpdateBodyType } from "../../../modules/lead/lead.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { ActivityAction, WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { prisma } from "../../../db/prisma.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('lead/update', async () => {
    void it('update lead as owner with full payload', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const payload: UpdateBodyType = {
            name: `test update ${randomUUID()}`,
            email: `${uniqueEmail()}`,
            phone: `${uniquePhoneNumber()}`,
            source: 'test source',
            note: 'test note'
        }

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, lead.body.data.id);
        assert.equal(parsedBody.data.workspaceId, workspace.body.data.id);
        assert.equal(parsedBody.data.name, payload.name);
        assert.equal(parsedBody.data.email, payload.email);
        assert.equal(parsedBody.data.phone, payload.phone);
        assert.equal(parsedBody.data.source, payload.source);
        assert.equal(parsedBody.data.note, payload.note);
    });

    void it('partial updates table', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            payload: UpdateBodyType;
        }> = [
                {
                    title: 'update name',
                    payload: {
                        name: `test update ${randomUUID()}`
                    }
                },
                {
                    title: 'update email',
                    payload: {
                        email: `${uniqueEmail()}`
                    }
                },
                {
                    title: 'update phone',
                    payload: {
                        phone: `${uniquePhoneNumber()}`
                    }
                },
                {
                    title: 'update source',
                    payload: {
                        source: 'test source'
                    }
                },
                {
                    title: 'update note',
                    payload: {
                        note: 'test note'
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(testCase.payload),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 200);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = okEnvelopeSchema(safeLeadSchema).parse(body);
                assert.equal(parsedBody.ok, true);
                assert.equal(parsedBody.data.id, lead.body.data.id);
                assert.equal(parsedBody.data.workspaceId, workspace.body.data.id);
                assert.equal(testCase.payload.name ? parsedBody.data.name : "", testCase.payload.name ?? "");
                assert.equal(testCase.payload.email ? parsedBody.data.email : "", testCase.payload.email ?? "");
                assert.equal(testCase.payload.phone ? parsedBody.data.phone : "", testCase.payload.phone ?? "");
                assert.equal(testCase.payload.source ? parsedBody.data.source : "", testCase.payload.source ?? "");
                assert.equal(testCase.payload.note ? parsedBody.data.note : "", testCase.payload.note ?? "");
            });
        }
    });

    void it('Authorized roles table', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const admin = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);
        const adminLead = await createLead(testServer, admin.body.data.accessToken, workspace.body.data.id);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);
        const memberLead = await createLead(testServer, member.body.data.accessToken, workspace.body.data.id);

        const cases: Array<{
            title: string;
            accessToken: string;
            workspaceId: string;
            leadId: string;
            payload: UpdateBodyType;
        }> = [
                {
                    title: 'admin update their own lead successfully',
                    accessToken: admin.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: adminLead.body.data.id,
                    payload: {
                        name: `test update ${randomUUID()}`,
                        email: `${uniqueEmail()}`,
                        phone: `${uniquePhoneNumber()}`,
                        source: 'test source',
                        note: 'test note'
                    }
                },
                {
                    title: 'owner update their own lead successfully',
                    accessToken: auth.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    payload: {
                        name: `test update ${randomUUID()}`,
                        email: `${uniqueEmail()}`,
                        phone: `${uniquePhoneNumber()}`,
                        source: 'test source',
                        note: 'test note'
                    }
                },
                {
                    title: 'allows admin to update any lead',
                    accessToken: admin.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: memberLead.body.data.id,
                    payload: {
                        name: `test update ${randomUUID()}`,
                        email: `${uniqueEmail()}`,
                        phone: `${uniquePhoneNumber()}`,
                        source: 'test source',
                        note: 'test note'
                    }
                },
                {
                    title: 'allows owner to update any lead',
                    accessToken: auth.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: memberLead.body.data.id,
                    payload: {
                        name: `test update ${randomUUID()}`,
                        email: `${uniqueEmail()}`,
                        phone: `${uniquePhoneNumber()}`,
                        source: 'test source',
                        note: 'test note'
                    }
                },
                {
                    title: 'member update their own lead successfully',
                    accessToken: member.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: memberLead.body.data.id,
                    payload: {
                        name: `test update ${randomUUID()}`,
                        email: `${uniqueEmail()}`,
                        phone: `${uniquePhoneNumber()}`,
                        source: 'test source',
                        note: 'test note'
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}`, {
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
                assert.equal(parsedBody.data.name, testCase.payload.name);
                assert.equal(parsedBody.data.email, testCase.payload.email);
                assert.equal(parsedBody.data.phone, testCase.payload.phone);
                assert.equal(parsedBody.data.source, testCase.payload.source);
                assert.equal(parsedBody.data.note, testCase.payload.note);
            });
        }
    });

    void it('auth failures table', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);
        const outsider = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace2.body.data.id, outsider.body.data.user.id, WorkspaceRole.member);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const payload: UpdateBodyType = {
            name: `test update ${randomUUID()}`,
            email: `${uniqueEmail()}`,
            phone: `${uniquePhoneNumber()}`,
            source: 'test source',
            note: 'test note'
        }

        const cases: Array<{
            title: string;
            accessToken?: string;
            workspaceId: string;
            leadId: string;
        }> = [
                {
                    title: 'no token',
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id
                },
                {
                    title: 'outsider',
                    accessToken: outsider.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id
                },
                {
                    title: 'member',
                    accessToken: member.body.data.accessToken,
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {

                let res: Response;
                let body: unknown;
                if (testCase.accessToken) {
                    ({ res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}`, {
                        method: 'PATCH',
                        body: JSON.stringify(payload),
                        headers: {
                            Authorization: `Bearer ${testCase.accessToken ?? ''}`
                        }
                    }));

                    assert.equal(res.status, 403);
                    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                    assert.ok(body);

                    const parsedBody = failEnvelopeSchema.parse(body);
                    assert.equal(parsedBody.ok, false);
                    if (testCase.title === 'outsider') {
                        assert.equal(parsedBody.message, "Forbidden");
                        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
                    }

                    if (testCase.title === 'member') {
                        assert.equal(parsedBody.message, "You don't have permission to update this lead");
                        assert.equal(parsedBody.code, 'FORBIDDEN');
                    }
                }
                else {
                    ({ res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}`, {
                        method: 'PATCH',
                        body: JSON.stringify(payload),
                    }));

                    assert.equal(res.status, 401);
                    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                    assert.ok(body);

                    const parsedBody = failEnvelopeSchema.parse(body);
                    assert.equal(parsedBody.ok, false);
                    assert.equal(parsedBody.message, "Unauthorized");
                    assert.equal(parsedBody.code, 'UNAUTHORIZED');
                }
            });
        }
    });

    void it("member updating another user's lead", async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const payload: UpdateBodyType = {
            name: `test update ${randomUUID()}`,
            email: `${uniqueEmail()}`,
            phone: `${uniquePhoneNumber()}`,
            source: 'test source',
            note: 'test note'
        }

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
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

    void it('invalid params table', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const payload: UpdateBodyType = {
            name: `test update ${randomUUID()}`,
            email: `${uniqueEmail()}`,
            phone: `${uniquePhoneNumber()}`,
            source: 'test source',
            note: 'test note'
        }

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
        }> = [
                {
                    title: 'invalid workspace',
                    workspaceId: 'invalid',
                    leadId: lead.body.data.id
                },
                {
                    title: 'invalid lead',
                    workspaceId: workspace.body.data.id,
                    leadId: 'invalid'
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
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

    void it('not found table', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);
        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace2.body.data.id);

        const payload: UpdateBodyType = {
            name: `test update ${randomUUID()}`,
            email: `${uniqueEmail()}`,
            phone: `${uniquePhoneNumber()}`,
            source: 'test source',
            note: 'test note'
        }

        type TitleCase = 'workspace not found' | 'lead not found' | 'lead in another workspace';

        const cases: Array<{
            title: TitleCase;
            workspaceId: string;
            leadId: string;
        }> = [
                {
                    title: 'workspace not found',
                    workspaceId: `${randomUUID()}`,
                    leadId: lead.body.data.id
                },
                {
                    title: 'lead not found',
                    workspaceId: workspace.body.data.id,
                    leadId: `${randomUUID()}`
                },
                {
                    title: 'lead in another workspace',
                    workspaceId: workspace.body.data.id,
                    leadId: lead2.body.data.id
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 404);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                if (testCase.title === 'workspace not found') {
                    assert.equal(parsedBody.message, "Workspace not found");
                    assert.equal(parsedBody.code, 'WORKSPACE_NOT_FOUND');
                } else {
                    assert.equal(parsedBody.message, "Lead not found");
                    assert.equal(parsedBody.code, 'LEAD_NOT_IN_WORKSPACE');
                }
            });
        }
    });

    void it('strict body rejection', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const payload = {
            [`${randomUUID()}`]: `${randomUUID()}`
        }

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
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

    void it('text validation table', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const payload: UpdateBodyType = {
            name: `test update ${randomUUID()}`,
            email: `${uniqueEmail()}`,
            phone: `${uniquePhoneNumber()}`,
            source: 'test source',
            note: 'test note'
        }

        const cases: Array<{
            title: string;
            payload: UpdateBodyType;
        }> = [
                {
                    title: 'greater than max length of name',
                    payload: {
                        ...payload,
                        name: 'a'.repeat(101)
                    }
                },
                {
                    title: 'greater than max length of source',
                    payload: {
                        ...payload,
                        source: 'a'.repeat(101)
                    }
                },
                {
                    title: 'greater than max length of note',
                    payload: {
                        ...payload,
                        note: 'a'.repeat(201)
                    }
                },
            ]

        for (const testcase of cases) {
            await t.test(testcase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(testcase.payload),
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
        }
    });

    void it('invalid email and phone', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            payload: UpdateBodyType;
        }> = [
                {
                    title: 'invalid email',
                    payload: {
                        ...lead.body.data,
                        email: 'invalid email'
                    }
                },
                {
                    title: 'invalid phone',
                    payload: {
                        ...lead.body.data,
                        phone: 'invalid phone'
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
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
                assert.equal(parsedBody.message, "Invalid request body");
                assert.equal(parsedBody.code, 'VALIDATION_ERROR');
            });
        }
    });

    void it('duplicate email and phone in the same workspace', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
            payload: UpdateBodyType;
        }> = [
                {
                    title: 'duplicate email',
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    payload: {
                        email: lead2.body.data.email
                    }
                },
                {
                    title: 'duplicate phone',
                    workspaceId: workspace.body.data.id,
                    leadId: lead.body.data.id,
                    payload: {
                        phone: lead2.body.data.phone
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(testCase.payload),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 409);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                if (testCase.title === 'duplicate email') {
                    assert.equal(parsedBody.message, "Duplicate email is not allowed");
                } else if (testCase.title === 'duplicate phone') {
                    assert.equal(parsedBody.message, "Duplicate phone is not allowed");
                }
                assert.equal(parsedBody.code, 'CONFLICT');
            });
        }
    });

    void it('update same email/phone in the same lead', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                email: lead.body.data.email,
                phone: lead.body.data.phone
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
        assert.equal(parsedBody.data.email, lead.body.data.email);
        assert.equal(parsedBody.data.phone, lead.body.data.phone);
    });

    void it('same email/phone in another workspace', async () => {
        const { auth, lead } = await setupLeadContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);
        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace2.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace2.body.data.id}/${lead2.body.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                email: lead.body.data.email,
                phone: lead.body.data.phone
            }),
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);
    });

    void it('activity log on successfull update', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                email: lead.body.data.email,
                phone: lead.body.data.phone
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
        assert.equal(parsedBody.data.email, lead.body.data.email);
        assert.equal(parsedBody.data.phone, lead.body.data.phone);

        const activityLogs = await prisma.activityLog.findMany({ where: { entityId: lead.body.data.id, action: ActivityAction.UPDATE_LEAD } });
        assert.equal(activityLogs.length, 1);
    });

    void it('no mutation/log on failed uodate', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                email: 'invalid email',
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

        const activityLogs = await prisma.activityLog.findMany({ where: { entityId: lead.body.data.id, action: ActivityAction.UPDATE_LEAD } });
        assert.equal(activityLogs.length, 0);

        const leadAfterFailedUpdate = await prisma.lead.findUnique({ where: { id: lead.body.data.id } });

        assert.ok(leadAfterFailedUpdate);

        const { deletedAt, ...leadAfterWithoutDeletedAt } = leadAfterFailedUpdate;

        assert.equal(deletedAt, null);
        assert.deepEqual(leadAfterWithoutDeletedAt, lead.body.data);
    });

    void it('return 400 when malformed JSON', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'PATCH',
            body: '{',
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

    void it('concurrent duplicate update', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const email = uniqueEmail();
        const phone = uniquePhoneNumber();

        const cases: Array<{
            title: string;
            payload: UpdateBodyType;
        }> = [
                {
                    title: 'concurrent duplicate email',
                    payload: {
                        email: email,
                    }
                },
                {
                    title: 'concurrent duplicate phone',
                    payload: {
                        phone: phone,
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const [result1, result2] = await Promise.all([
                    jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify(testCase.payload),
                        headers: {
                            Authorization: `Bearer ${auth.body.data.accessToken}`
                        }
                    }),
                    jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead2.body.data.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify(testCase.payload),
                        headers: {
                            Authorization: `Bearer ${auth.body.data.accessToken}`
                        }
                    })
                ])

                const statuses = [result1.res.status, result2.res.status].sort();

                assert.deepEqual(statuses, [200, 409]);
            })
        }
    });

    void it('soft-deleted lead uniqueness behavior', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await prisma.lead.delete({
            where: {
                id: lead.body.data.id
            }
        });

        const cases: Array<{
            title: string;
            payload: UpdateBodyType;
        }> = [
                {
                    title: 'duplicate email',
                    payload: {
                        email: lead.body.data.email
                    }
                },
                {
                    title: 'duplicate phone',
                    payload: {
                        phone: lead.body.data.phone
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead2.body.data.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(testCase.payload),
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    }
                });

                assert.equal(res.status, 409);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, "Duplicate email or phone is not allowed");
                assert.equal(parsedBody.code, 'CONFLICT');
            })
        }
    })
});