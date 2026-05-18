import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { createWorkspace, registerAndLogin } from "../../helper.js";
import { failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { getByUserIdResponseSchema } from "../../../modules/workspace/workspace.schemas.js";


let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('worksapce', () => {

    void it('creates a workspace and returns owner workspace payload', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const { res, body } = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(res.status, 201);

        assert.equal(body.ok, true);
        assert.equal(body.data.createdBy, registerAndLoginResponse.body.data.user.id);
    });

    void it('reject duplicate workspace names for the same user', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const firstWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const { res, body } = await jsonRequest(testServer, '/api/workspaces', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            },
            body: JSON.stringify({
                name: firstWorkspaceResponse.body.data.name,
            }),
        });

        assert.equal(res.status, 409);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Workspace name already exists');
    });

    void it('list only workspace owned by authenticated user', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);
        const outsiderRegisterAndLoginResponse = await registerAndLogin(testServer);

        const firstWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);
        const secondWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const outsiderWorkspaceResponse = await createWorkspace(testServer, outsiderRegisterAndLoginResponse.body.data.accessToken);

        const { res, body } = await jsonRequest(testServer, '/api/workspaces?page=1&limit=10', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsed = okEnvelopeSchema(getByUserIdResponseSchema).parse(body);
        assert.equal(parsed.ok, true);

        assert.equal(parsed.data.data.length, 2);
        assert.equal(parsed.data.data.some(workspace => workspace.name === firstWorkspaceResponse.body.data.name), true);
        assert.equal(parsed.data.data.some(workspace => workspace.name === secondWorkspaceResponse.body.data.name), true);

        assert.equal(parsed.data.data.some(workspace => workspace.name === outsiderWorkspaceResponse.body.data.name), false);

        assert.equal(parsed.data.paginationMeta.page, 1);
        assert.equal(parsed.data.paginationMeta.limit, 10);
    });

    void it('reject non-members from reading workspace detail', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);
        const outsiderRegisterAndLoginResponse = await registerAndLogin(testServer);

        const firstWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        const { res, body } = await jsonRequest(testServer, `/api/workspaces/${firstWorkspaceResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${outsiderRegisterAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
    })
});
