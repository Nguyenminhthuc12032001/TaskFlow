import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, createTask, linkTask, registerAndLogin, setupLeadContext, setupTaskContext } from "../../helper.js";
import assert from "node:assert";
import { safeLeadDetailSchema } from "../../../modules/lead/lead.schemas.js";
import { failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { WorkspaceRole } from "../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";
import { prisma } from "../../../db/prisma.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('lead/getById', async () => { 
    void it('get lead successfully', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const admin = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const cases: Array<{
            title: string;
            accessToken: string;
        }> = [
                {
                    title: 'owner get lead successfully',
                    accessToken: auth.body.data.accessToken
                },
                {
                    title: 'admin get lead successfully',
                    accessToken: admin.body.data.accessToken
                },
                {
                    title: 'member get lead successfully',
                    accessToken: member.body.data.accessToken
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${testCase.accessToken}`
                    }
                })

                assert.equal(res.status, 200);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = okEnvelopeSchema(safeLeadDetailSchema).parse(body);
                assert.equal(parsedBody.ok, true);
                assert.equal(parsedBody.data.id, lead.body.data.id);
                assert.equal(parsedBody.data.name, lead.body.data.name);
                assert.equal(parsedBody.data.note, lead.body.data.note);
                assert.equal(parsedBody.data.email, lead.body.data.email);
                assert.equal(parsedBody.data.phone, lead.body.data.phone);
                assert.equal(parsedBody.data.source, lead.body.data.source);
                assert.equal(parsedBody.data.stage, lead.body.data.stage);
                assert.equal(parsedBody.data.createdBy, auth.body.data.user.id);
                assert.equal(parsedBody.data.workspaceId, workspace.body.data.id);
                assert.equal(parsedBody.data.createdAt instanceof Date, true);
                assert.equal(parsedBody.data.updatedAt instanceof Date, true);
                assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
                assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);

                assert.equal('deletedAt' in parsedBody.data, false);

                assert.equal(parsedBody.data.taskLinks.length, 0);
            })
        }
    });

    void it('get lead have taskLinks', async () => {
        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        })


        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadDetailSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, lead.body.data.id);
        assert.equal(parsedBody.data.taskLinks.length, 1);

        assert.equal(parsedBody.data.taskLinks[0].id, task.body.data.id);
        assert.equal(parsedBody.data.taskLinks[0].projectId, project.body.data.id);
        assert.equal(parsedBody.data.taskLinks[0].columnId, columnId);
        assert.equal(parsedBody.data.taskLinks[0].title, task.body.data.title);
        assert.equal(parsedBody.data.taskLinks[0].priority, task.body.data.priority);
        assert.equal(parsedBody.data.taskLinks[0].createdBy, task.body.data.createdBy);
        assert.equal(parsedBody.data.taskLinks[0].description, task.body.data.description);
        assert.equal(parsedBody.data.taskLinks[0].dueDate?.getDate(), task.body.data.dueDate?.getDate());
        assert.equal(parsedBody.data.taskLinks[0].position, task.body.data.position);
        assert.equal(Number.isNaN(parsedBody.data.taskLinks[0].createdAt.getTime()), false);
        assert.equal(Number.isNaN(parsedBody.data.taskLinks[0].updatedAt.getTime()), false);
        assert.equal(parsedBody.data.taskLinks[0].createdAt instanceof Date, true);
        assert.equal(parsedBody.data.taskLinks[0].updatedAt instanceof Date, true);

        assert.equal('deletedAt' in parsedBody.data.taskLinks[0], false); 
    });

    void it('rejects viewer from getting lead', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const viewer = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'GET',
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

    void it('rejects outsider user from getting lead', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const outsider = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'GET',
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

    void it('rejects unauthenticated user from getting lead', async () => {
        const { workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'GET',
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Unauthorized');
        assert.equal(failBody.code, 'UNAUTHORIZED');
    });

    void it('rejects invalid request parameters', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
        }> = [
                {
                    title: 'invalid workspace id',
                    workspaceId: 'invalid',
                    leadId: lead.body.data.id
                },
                {
                    title: 'invalid lead id',
                    workspaceId: workspace.body.data.id,
                    leadId: 'invalid'
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}`, {
                    method: 'GET',
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

    void it('reject when parameters id does not exist', async (t) => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const leadContext2 = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            workspaceId: string;
            leadId: string;
        }> = [
                {
                    title: 'workspace does not exist',
                    workspaceId: `${randomUUID()}`,
                    leadId: lead.body.data.id,
                },
                {
                    title: 'lead does not exist',
                    workspaceId: workspace.body.data.id,
                    leadId: `${randomUUID()}`,
                },
                {
                    title: 'lead does not exist in workspace',
                    workspaceId: workspace.body.data.id,
                    leadId: leadContext2.lead.body.data.id,
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${testCase.workspaceId}/${testCase.leadId}`, {
                    method: 'GET',
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
                } else if (testCase.title === 'lead does not exist') {
                    assert.equal(failBody.message, 'Lead not found');
                    assert.equal(failBody.code, 'LEAD_NOT_IN_WORKSPACE');
                } else if (testCase.title === 'lead does not exist in workspace') {
                    assert.equal(failBody.message, 'Lead not found');
                    assert.equal(failBody.code, 'LEAD_NOT_IN_WORKSPACE');
                }
            })
        }
    });

    void it('rejects when geting deleted lead', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const deletedLead = await prisma.lead.delete({
            where: {
                id: lead.body.data.id
            }
        });

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${deletedLead.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 404);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const failBody = failEnvelopeSchema.parse(body);

        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Lead not found');
        assert.equal(failBody.code, 'LEAD_NOT_IN_WORKSPACE');
    });

    void it('does not return workspace, creator, taskLinks.lead, taskLinks.task.deletedAt', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

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
        assert.equal(parsedBody.data.name, lead.body.data.name);
        assert.equal(parsedBody.data.note, lead.body.data.note);
        assert.equal(parsedBody.data.email, lead.body.data.email);
        assert.equal(parsedBody.data.phone, lead.body.data.phone);
        assert.equal(parsedBody.data.source, lead.body.data.source);
        assert.equal(parsedBody.data.stage, lead.body.data.stage);
        assert.equal(parsedBody.data.createdBy, auth.body.data.user.id);
        assert.equal(parsedBody.data.workspaceId, workspace.body.data.id);
        assert.equal(parsedBody.data.taskLinks.length, 0);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(parsedBody.data.updatedAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal(Number.isNaN(parsedBody.data.updatedAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);

        assert.equal('workspace' in parsedBody.data, false);
        assert.equal('creator' in parsedBody.data, false); 
    });

    // Response envelope chỉ có đúng shape { ok, data }.
    void it('responds with envelope shape { ok, data }', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            }
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        assert.deepEqual(Object.keys(body), ['ok', 'data']);

        const parsedBody = okEnvelopeSchema(safeLeadDetailSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal('data' in parsedBody, true);
    });
 
    void it('get lead have taskLinks', async (t) => {

        const cases: Array<{
            title: string;
            setup: () => Promise<{
                token: string;
                workspaceId: string;
                leadId: string;
                linkedTasksId: string[];
            }>
        }> = [
                {
                    title: 'lead have 1 taskLink',
                    setup: async () => {
                        const { auth, workspace, task } = await setupTaskContext(testServer);

                        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

                        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

                        return {
                            token: auth.body.data.accessToken,
                            workspaceId: workspace.body.data.id,
                            leadId: lead.body.data.id,
                            linkedTasksId: [task.body.data.id]
                        }
                    }
                },
                {
                    title: 'lead have 2 taskLinks',
                    setup: async () => {
                        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);
                        const task2 = await createTask(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId);
                        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

                        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);
                        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task2.body.data.id);

                        return {
                            token: auth.body.data.accessToken,
                            workspaceId: workspace.body.data.id,
                            leadId: lead.body.data.id,
                            linkedTasksId: [task.body.data.id, task2.body.data.id]
                        }
                    }
                },
                {
                    title: "does not include another lead's taskLinks",
                    setup: async () => {
                        const { auth, workspace, project, columnId, task } = await setupTaskContext(testServer);

                        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
                        const taks2 = await createTask(testServer, auth.body.data.accessToken, workspace.body.data.id, project.body.data.id, columnId);

                        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead2.body.data.id, taks2.body.data.id);

                        const lead = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

                        await linkTask(testServer, auth.body.data.accessToken, workspace.body.data.id, lead.body.data.id, task.body.data.id);

                        return {
                            token: auth.body.data.accessToken,
                            workspaceId: workspace.body.data.id,
                            leadId: lead.body.data.id,
                            linkedTasksId: [task.body.data.id]
                        }

                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { token, workspaceId, leadId, linkedTasksId } = await testCase.setup();

                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspaceId}/${leadId}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                assert.equal(res.status, 200);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                assert.deepEqual(Object.keys(body), ['ok', 'data']);

                const parsedBody = okEnvelopeSchema(safeLeadDetailSchema).parse(body);
                assert.equal(parsedBody.ok, true);
                assert.equal('data' in parsedBody, true);
                assert.equal(parsedBody.data.taskLinks.length, linkedTasksId.length);
                assert.equal(parsedBody.data.taskLinks.every((taskLink) => linkedTasksId.includes(taskLink.id)), true);
            })
        }
    });
});