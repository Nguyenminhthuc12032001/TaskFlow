import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createLead, createWorkspace, registerAndLogin, setupLeadContext } from "../../helper.js";
import assert from "node:assert";
import { failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeLeadsSchema } from "../../../modules/lead/lead.schemas.js";
import { LeadStage, WorkspaceRole } from "../../../../prisma/generated/enums.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('lead/listByActor', async () => {
    void it('list leads across all actor workspaces', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);
        const lead2 = await createLead(testServer, auth.body.data.accessToken, workspace2.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads`, {
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
        assert.equal(parsedBody.data.data.some((item) => item.id === lead.body.data.id && item.workspaceId === workspace.body.data.id && lead.body.data.createdBy === auth.body.data.user.id), true);
        assert.equal(parsedBody.data.data.some((item) => item.id === lead2.body.data.id && item.workspaceId === workspace2.body.data.id && lead.body.data.createdBy === auth.body.data.user.id), true);

        assert.equal(parsedBody.data.data.every((item) => 'deletedAt' in item === false), true);
    });

    void it('does not return leads from outsider workspaces', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        const outsider = await setupLeadContext(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads`, {
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
        assert.equal(parsedBody.data.data.some((item) => item.id === lead.body.data.id && lead.body.data.workspaceId === workspace.body.data.id && lead.body.data.createdBy === auth.body.data.user.id), true);
        assert.equal(parsedBody.data.data.some((item) => item.id === outsider.lead.body.data.id && outsider.lead.body.data.workspaceId === outsider.workspace.body.data.id && outsider.lead.body.data.createdBy === outsider.auth.body.data.user.id), false);
    });

    void it('does not return leads from workspaces where actor is viewer', async () => {
        const { workspace } = await setupLeadContext(testServer);

        const viewer = await registerAndLogin(testServer);
        await addWorkspaceMember(workspace.body.data.id, viewer.body.data.user.id, WorkspaceRole.viewer);

        const { res, body } = await jsonRequest(testServer, `/api/leads`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${viewer.body.data.accessToken}`
            },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
        assert.ok(body);

        const parsedBody = okEnvelopeSchema(safeLeadsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, 0);
    });

    void it('returns empty list when actor has no eligible workspaces', async () => {
        await setupLeadContext(testServer);
        await setupLeadContext(testServer);

        const actor = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${actor.body.data.accessToken}`
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

        const { res, body } = await jsonRequest(testServer, `/api/leads`, {
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
        assert.equal(parsedBody.data.data[0].createdAt.getTime() > parsedBody.data.data[1].createdAt.getTime(), true);
    });

    void it('excludes soft-deleted leads', async () => {
        const { auth, workspace, lead } = await setupLeadContext(testServer);

        await jsonRequest(testServer, `/api/leads/${workspace.body.data.id}/${lead.body.data.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${auth.body.data.accessToken}`
            },
        });

        const { res, body } = await jsonRequest(testServer, `/api/leads`, {
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

    void it('uses default pagination page and limit', async () => {
        const auth = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/leads`, {
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

    void it('supports page and limit query', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads?page=2&limit=1`, {
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
        assert.equal(parsedBody.data.paginationMeta.page, 2);
        assert.equal(parsedBody.data.paginationMeta.limit, 1);
    });

    void it('returns empty list for page beyond total', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads?page=4&limit=1`, {
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

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads?limit=101`, {
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

    void it('filters by workspace id', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

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
        assert.equal(parsedBody.data.data.length, 3);
    });

    void it('workspace id filters for inaccessible workspaces returns empty list', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        const workspace2 = await createWorkspace(testServer, auth.body.data.accessToken);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads?workspaceId=${workspace2.body.data.id}`, {
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

    void it('filters by search case-insensitive', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads?search=lead`, {
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
        assert.equal(parsedBody.data.data.some((item) => item.name.toLowerCase().includes('lead')), true);
    });

    void it('trims empty search and treat it as no search', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads?search=   `, {
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
        assert.equal(parsedBody.data.data.length, 3);
    });

    void it('rejects search over 100 characters', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads?search=${'a'.repeat(101)}`, {
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

    void it('filters by stage', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const { res, body } = await jsonRequest(testServer, `/api/leads?stage=${LeadStage.new}`, {
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

    void it('filters by startDate only', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);

        const { res, body } = await jsonRequest(testServer, `/api/leads?startDate=${startDate.toISOString()}`, {
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

    void it('filters by endDate only', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const endDate = new Date(); 

        const { res, body } = await jsonRequest(testServer, `/api/leads?endDate=${endDate.toISOString()}`, {
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

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date(); 

        const { res, body } = await jsonRequest(testServer, `/api/leads?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
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

    void it('rejects startDate after endDate', async () => {
        const { auth } = await setupLeadContext(testServer);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 2);

        const { res, body } = await jsonRequest(testServer, `/api/leads?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
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
        const { auth } = await setupLeadContext(testServer);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);

        const { res, body } = await jsonRequest(testServer, `/api/leads?startDate=${startDate.toISOString()}`, {
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
        const { auth } = await setupLeadContext(testServer);
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
        
        const { res, body } = await jsonRequest(testServer, `/api/leads?endDate=${endDate.toISOString()}`, {
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

    void it('combines workspaceId and search and date filters correctly', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);

        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);
        await createLead(testServer, auth.body.data.accessToken, workspace.body.data.id);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date(); 

        const search = 'lead';
        const { res, body } = await jsonRequest(testServer, `/api/leads?workspaceId=${workspace.body.data.id}&search=${search}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
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
        assert.equal(parsedBody.data.data.length, 3);
        assert.equal(parsedBody.data.data.every((item) => item.createdAt >= startDate && item.createdAt <= endDate), true);
        assert.equal(parsedBody.data.data.every((item) => item.name.toLowerCase().includes(search)), true);
        assert.equal(parsedBody.data.data.every((item) => item.workspaceId === workspace.body.data.id), true);
    });

    void it('rejects unauthenticated request', async () => {
        const { res, body } = await jsonRequest(testServer, `/api/leads`, {
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

    void it('rejects invalid accessToken', async () => {
        const { res, body } = await jsonRequest(testServer, `/api/leads`, {
            method: 'GET',
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

    void it('rejects invalid page/limit/stage/workspaceId/date query parameters', async (t) => {
        const { auth, workspace } = await setupLeadContext(testServer);
        
        const cases: Array<{
            title: string;
            workspaceId: string | undefined;
            page: string | undefined;
            limit: string | undefined;
            stage: string | undefined;
            startDate: string | undefined;
            endDate: string | undefined;
        }> = [
            {
                title: 'invalid page',
                workspaceId: undefined,
                page: 'invalid',
                limit: undefined,
                stage: undefined,
                startDate: undefined,
                endDate: undefined
            },
            {
                title: 'invalid limit',
                workspaceId: undefined,
                page: undefined,
                limit: 'invalid',
                stage: undefined,
                startDate: undefined,
                endDate: undefined
            },
            {
                title: 'invalid stage',
                workspaceId: undefined,
                page: undefined,
                limit: undefined,
                stage: 'invalid',
                startDate: undefined,
                endDate: undefined
            },
            {
                title: 'invalid workspaceId',
                workspaceId: 'invalid',
                page: undefined,
                limit: undefined,
                stage: undefined,
                startDate: undefined,
                endDate: undefined
            },
            {
                title: 'invalid startDate',
                workspaceId: undefined,
                page: undefined,
                limit: undefined,
                stage: undefined,
                startDate: 'invalid',
                endDate: undefined
            },
            {
                title: 'invalid endDate',
                workspaceId: undefined,
                page: undefined,
                limit: undefined,
                stage: undefined,
                startDate: undefined,
                endDate: 'invalid'
            },
            {
                title: 'invalid startDate and endDate',
                workspaceId: undefined,
                page: undefined,
                limit: undefined,
                stage: undefined,
                startDate: 'invalid',
                endDate: 'invalid'
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const { res, body } = await jsonRequest(testServer, `/api/leads?workspaceId=${workspace.body.data.id}&page=${testCase.page}&limit=${testCase.limit}&stage=${testCase.stage}`, {
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
            })
        }
    });

    void it('rejects unknown query parameters', async () => {
        const { auth, workspace } = await setupLeadContext(testServer);
        
        const { res, body } = await jsonRequest(testServer, `/api/leads?unknown=1&workspaceId=${workspace.body.data.id}`, {
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