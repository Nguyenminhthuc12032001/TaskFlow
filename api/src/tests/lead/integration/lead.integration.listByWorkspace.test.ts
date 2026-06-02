import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, createWorkspace, registerAndLogin, setupLeadContext, setupWorkspaceContext } from "../../helper.js";
import assert from "node:assert";
import { failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeLeadsSchema } from "../../../modules/lead/lead.schemas.js";
import { WorkspaceRole, LeadStage } from "../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";
import { prisma } from "../../../db/prisma.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe("lead/listByWorkspace", async () => {
    void it("list leads in the requested workspace for workspace owner", async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads?workspaceId=${workspace.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 2);

        assert.equal(parsedBody.data.data.some((item) => item.id === lead.body.data.id && item.workspaceId === workspace.body.data.id && item.createdBy === auth.body.data.user.id), true);
        assert.equal(parsedBody.data.data.some((item) => item.id === lead2.body.data.id && item.workspaceId === workspace.body.data.id && item.createdBy === auth.body.data.user.id), true);

        assert.equal(parsedBody.data.data.every((item) => 'deletedAt' in item === false), true);
    });

    void it('allows admin and member to list leads', async (t) => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const admin = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, admin.body.data.user.id, WorkspaceRole.admin);

        const member = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, member.body.data.user.id, WorkspaceRole.member);

        const cases: Array<{
            title: string;
            accessToken: string;
        }> = [
                {
                    title: 'admin list leads successfully',
                    accessToken: admin.body.data.accessToken
                },
                {
                    title: 'member list leads successfully',
                    accessToken: member.body.data.accessToken
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${testCase.accessToken}`
                    },
                });

                assert.equal(res.status, 200);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(body);

                const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
                assert.equal(parsedBody.ok, true);
                assert.equal(parsedBody.data.data.length, 2);
            })
        }
    });

    void it('rejects viewer from listing leads', async () => {
        const { workspace } = await setupLeadContext(testServer);

        const viewer = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${viewer.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('rejects user outside from listing leads', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);

        const outsider = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace2.body.data.id, outsider.body.data.user.id, WorkspaceRole.member);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${outsider.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 403);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Forbidden');
        assert.equal(parsedBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('rejects unauthenticated request from listing leads', async () => {
        const { workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'GET',
        });

        assert.equal(res.status, 401);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Unauthorized');
        assert.equal(parsedBody.code, 'UNAUTHORIZED');
    });

    void it('rejects invalid token from listing leads', async () => {
        const { workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer invalid-token`
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

    void it('rejects when workspace does not exist', async () => {
        const { auth } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${randomUUID()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 404);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Workspace not found');
        assert.equal(parsedBody.code, 'WORKSPACE_NOT_FOUND');
    });

    void it('returns 400 for invalid workspaceId', async () => {
        const { auth } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/invalid`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('does not return leads from another workspace', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);
        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace2.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 1);
        assert.equal(parsedBody.data.data.some((item) => item.id === lead.body.data.id && item.workspaceId === workspace.body.data.id && lead.body.data.createdBy === auth.body.data.user.id), true);
        assert.equal(parsedBody.data.data.some((item) => item.id === lead2.body.data.id), false);
    });

    void it('returns empty list when workspace has no leads', async () => {
        const { auth, workspace } = await setupWorkspaceContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 0);
    });

    void it('orders leads by createdAt desc', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 2);;
        assert.equal(parsedBody.data.data[0].createdAt > parsedBody.data.data[1].createdAt, true);
    });

    void it('deleted lead are not returned after delete flow', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        await prisma.lead.delete({
            where: {
                id: lead.body.data.id
            }
        });

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 0);
    });

    void it('uses default pagination', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.paginationMeta.page, 1);
        assert.equal(parsedBody.data.paginationMeta.limit, 10);
    });

    void it('supports page and limit', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        let count = 0;
        while (count < 11) {
            await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
            count++;
        }

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?page=2&limit=5`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.paginationMeta.page, 2);
        assert.equal(parsedBody.data.paginationMeta.limit, 5);
    });

    void it('returns empty data when page is beyond total', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?page=2&limit=5`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 0);
    });

    void it('caps limit at 100', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?limit=101`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.paginationMeta.limit, 100);
    });

    void it('rejects invalid page:0/negative/non-number/decimal', async (t) => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            page: string;
        }> = [
                {
                    title: 'invalid page 0',
                    page: '0'
                },
                {
                    title: 'invalid page negative',
                    page: '-1'
                },
                {
                    title: 'invalid page non-number',
                    page: 'a'
                },
                {
                    title: 'invalid page decimal',
                    page: '1.1'
                }
            ]

        for (const { title, page } of cases) {
            await t.test(title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?page=${page}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    },
                });

                assert.equal(res.status, 400);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(res.body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, 'Invalid query parameters');
                assert.equal(parsedBody.code, 'VALIDATION_ERROR');
            })
        }
    });

    void it('reject invalid limit: 0/negative/non-number/decimal', async (t) => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const cases: Array<{
            title: string;
            limit: string;
        }> = [
                {
                    title: 'invalid limit 0',
                    limit: '0'
                },
                {
                    title: 'invalid limit negative',
                    limit: '-1'
                },
                {
                    title: 'invalid limit non-number',
                    limit: 'a'
                },
                {
                    title: 'invalid limit decimal',
                    limit: '1.1'
                }
            ]

        for (const { title, limit } of cases) {
            await t.test(title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?limit=${limit}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${auth.body.data.accessToken}`
                    },
                });

                assert.equal(res.status, 400);
                assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
                assert.ok(res.body);

                const parsedBody = failEnvelopeSchema.parse(body);
                assert.equal(parsedBody.ok, false);
                assert.equal(parsedBody.message, 'Invalid query parameters');
                assert.equal(parsedBody.code, 'VALIDATION_ERROR');
            })
        }
    });

    void it('filters by search on lead name', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?search=lead`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.every((item) => item.name.toLowerCase().includes('lead')), true);
    });

    void it('search in case-insensitive', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?search=Lead`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.every((item) => item.name.toLowerCase().includes('lead')), true);
    });

    void it('empty/whitespace search behaves like no search', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?search=   `, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 1);
    });

    void it('rejects search over 100 chars', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?search=${'a'.repeat(101)}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(res.body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid query parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('filters by stage', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?stage=${LeadStage.new}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.every((item) => item.stage === LeadStage.new), true);
    });

    void it('rejects invalid stage', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?stage=invalid`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(res.body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid query parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('filters by startDate', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const startDate: Date = new Date();
        startDate.setDate(startDate.getDate() - 1);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?startDate=${startDate.toISOString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.every((item) => item.createdAt >= startDate), true);
    });

    void it('filters by endDate', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const endDate: Date = new Date();

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?endDate=${endDate.toISOString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.every((item) => item.createdAt <= endDate), true);
    });

    void it('filters by inclusive startDate and endDate', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const startDate: Date = new Date();
        startDate.setDate(startDate.getDate() - 1);

        const endDate: Date = new Date();

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.every((item) => item.createdAt >= startDate && item.createdAt <= endDate), true);
    });

    void it('rejects invalid date format', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?startDate=invalid`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(res.body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid query parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('rejects startDate > endDate', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 2);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid query parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('rejects future startDate', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?startDate=${startDate.toISOString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Start date must be in the past');
        assert.equal(parsedBody.code, 'INVALID_ERROR');
    });

    void it('rejects future endDate', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?endDate=${endDate.toISOString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'End date must be in the past');
        assert.equal(parsedBody.code, 'INVALID_ERROR');
    });

    void it('combines filters correctly: search + stage + startDate + endDate', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const startDate: Date = new Date();
        startDate.setDate(startDate.getDate() - 1);

        const endDate: Date = new Date();

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?search=lead&stage=${LeadStage.new}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.every((item) => item.name.toLowerCase().includes('lead') && item.stage === LeadStage.new && item.createdAt >= startDate && item.createdAt <= endDate), true);
    });

    void it('rejects unknown query parameters', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}?foo=bar`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 400);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid query parameters');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });
});
