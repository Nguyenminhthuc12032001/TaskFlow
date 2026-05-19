import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js";
import { addWorkspaceMember, createProject, createWorkspace, registerAndLogin } from "../../helper.js";
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { safeColumnSchema, safeColumnsSchema } from "../../../modules/column/column.schemas.js";
import { randomUUID } from "node:crypto";
import { ColumnType, WorkspaceRole } from "../../../../prisma/generated/enums.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('column', () => {
    void it('reject non-member from listing columns', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsed = failEnvelopeSchema.parse(body);

        assert.equal(parsed.ok, false);
        assert.equal(parsed.message, 'Forbidden');
        assert.equal(parsed.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject non-member from reading column detail', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnResponse.data.data[0].id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const parsed = failEnvelopeSchema.parse(body);

        assert.equal(parsed.ok, false);
        assert.equal(parsed.message, 'Forbidden');
        assert.equal(parsed.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject non-member from creating column', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const payload = {
            name: `Column ${randomUUID()}`,
            type: ColumnType.todo,
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject non-member from updating column', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const payload = {
            name: `Column ${randomUUID()}`,
            type: ColumnType.todo,
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnResponse.data.data[0].id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject non-member from deleting column', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const registerAndLoginResponseOutsider = await registerAndLogin(testServer);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnResponse.data.data[0].id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseOutsider.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'USER_NOT_WORKSPACE_MEMBER');
    });

    void it('reject members or viewers from creating columns', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const payload = {
            name: `Column ${randomUUID()}`,
            type: ColumnType.todo,
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject members or viewers from updating columns', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const payload = {
            name: `Column ${randomUUID()}`,
            type: ColumnType.todo,
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnResponse.data.data[0].id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject members or viewers from deleting columns', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnResponse.data.data[0].id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    void it('reject members or viewers re_ordering columns', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const payload = parsedListColumnResponse.data.data.map((column) => ({
            columnId: column.id,
            position: column.position + 1,
        }));

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 403);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Forbidden');
        assert.equal(failBody.code, 'INSUFFICIENT_WORKSPACE_ROLE');
    });

    // allows members and viewers reading column detail and list columns
    void it('allows members and viewers reading column list and detail', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseMember = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseMember.body.data.user.id);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnResponse.data.data[0].id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponseMember.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedDetailColumnResponse = okEnvelopeSchema(safeColumnSchema).parse(body);

        assert.equal(parsedDetailColumnResponse.ok, true);
        assert.equal(parsedDetailColumnResponse.data.id, parsedListColumnResponse.data.data[0].id);
        assert.equal(parsedDetailColumnResponse.data.name, parsedListColumnResponse.data.data[0].name);
        assert.equal(parsedDetailColumnResponse.data.type, parsedListColumnResponse.data.data[0].type);
        assert.equal(parsedDetailColumnResponse.data.position, parsedListColumnResponse.data.data[0].position);
        assert.equal(parsedDetailColumnResponse.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedDetailColumnResponse.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedDetailColumnResponse.data, false);
        assert.equal('updatedAt' in parsedDetailColumnResponse.data, false);
    });

    void it('reject dulicate column name in same project', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const payload = {
            name: parsedListColumnResponse.data.data[0].name,
            type: ColumnType.todo,
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 409);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Duplicate name is not allowed');
        assert.equal(failBody.code, 'DUPLICATE_COLUMN_NAME');
    });

    void it('reject duplicate column name and difirent casing in same project', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const payload = {
            name: parsedListColumnResponse.data.data[0].name.toLowerCase(),
            type: ColumnType.todo,
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 409);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Duplicate name is not allowed');
        assert.equal(failBody.code, 'DUPLICATE_COLUMN_NAME');
    });

    void it('allow duplicate column name in different project', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const payload = {
            name: parsedListColumnResponse.data.data[0].name,
            type: ColumnType.todo,
        };

        const createSecondProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createSecondProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createSecondProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createSecondProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createSecondProjectResponse.body.data, false);
        assert.equal('updatedAt' in createSecondProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createSecondProjectResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 201);

        const parsedBody = createdEnvelopeSchema(safeColumnSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.created, true);
        assert.equal(parsedBody.data.name, payload.name);
        assert.equal(parsedBody.data.type, payload.type);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
        assert.equal('updatedAt' in parsedBody.data, false);
    });

    void it('create column successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const payload = {
            name: `Column ${randomUUID()}`,
            type: ColumnType.todo,
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 201);

        const parsedBody = createdEnvelopeSchema(safeColumnSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.created, true);
        assert.equal(parsedBody.data.name, payload.name);
        assert.equal(parsedBody.data.type, payload.type);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
        assert.equal('updatedAt' in parsedBody.data, false);
    });

    void it('list columns successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeColumnsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.ok(parsedBody.data.data.length >= 3);
        assert.equal(parsedBody.data.data.some(column => column.name === 'Todo' && column.position === 1 && column.type === 'todo'), true);
        assert.equal(parsedBody.data.data.some(column => column.name === 'In Progress' && column.position === 2 && column.type === 'in_process'), true);
        assert.equal(parsedBody.data.data.some(column => column.name === 'Done' && column.position === 3 && column.type === 'done'), true);
        assert.equal(parsedBody.data.paginationMeta.page, 1);
        assert.equal(parsedBody.data.paginationMeta.limit, 10);
        assert.ok(parsedBody.data.data.every((column, index) => column.position === index + 1));
    });

    void it('search columns by name successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const payload = {
            name: `Column ${randomUUID()}`,
            type: ColumnType.todo,
        };

        const createColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(createColumnResponse.res.status, 201);

        const parsedCreateColumnResponse = createdEnvelopeSchema(safeColumnSchema).parse(createColumnResponse.body);
        assert.equal(parsedCreateColumnResponse.ok, true);
        assert.equal(parsedCreateColumnResponse.created, true);
        assert.equal(parsedCreateColumnResponse.data.name, payload.name);
        assert.equal(parsedCreateColumnResponse.data.type, payload.type);
        assert.equal(parsedCreateColumnResponse.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedCreateColumnResponse.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedCreateColumnResponse.data, false);
        assert.equal('updatedAt' in parsedCreateColumnResponse.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}?name=${payload.name}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeColumnsSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.ok(parsedBody.data.data.length >= 1);
        assert.match(parsedBody.data.data[0].name, new RegExp(`^${payload.name}$`));
    });

    void it('filter columns by type successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsFilteredResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}?type=${ColumnType.todo}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsFilteredResponse.res.status, 200);

        const parsedListColumnsFilteredResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsFilteredResponse.body);
        assert.equal(parsedListColumnsFilteredResponse.ok, true);
        assert.ok(parsedListColumnsFilteredResponse.data.data.length >= 1);
        assert.ok(parsedListColumnsFilteredResponse.data.data.every((column) => column.type === ColumnType.todo));
    });

    void it('get detail columns successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);
        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length >= 1);
        assert.equal(parsedListColumnsResponse.data.data[0].createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedListColumnsResponse.data.data[0].createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedListColumnsResponse.data.data[0], false);
        assert.equal('updatedAt' in parsedListColumnsResponse.data.data[0], false);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeColumnSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, parsedListColumnsResponse.data.data[0].id);
        assert.equal(parsedBody.data.name, parsedListColumnsResponse.data.data[0].name);
        assert.equal(parsedBody.data.type, parsedListColumnsResponse.data.data[0].type);
        assert.equal(parsedBody.data.position, parsedListColumnsResponse.data.data[0].position);
        assert.equal(parsedBody.data.projectId, parsedListColumnsResponse.data.data[0].projectId);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
        assert.equal('updatedAt' in parsedBody.data, false);
    });

    void it('reject reading detail columns from different project', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const createProjectResponse2 = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse2.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse2.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse2.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse2.body.data, false);
        assert.equal('updatedAt' in createProjectResponse2.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse2.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Column not found');
        assert.equal(failBody.code, 'COLUMN_NOT_IN_PROJECT');
    });

    void it('update column successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseAdmin = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseAdmin.body.data.user.id, WorkspaceRole.admin);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = {
            name: "Test update column successfully",
            type: ColumnType.done,
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeColumnSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, parsedListColumnsResponse.data.data[0].id);
        assert.equal(parsedBody.data.name, payload.name);
        assert.equal(parsedBody.data.type, payload.type);
        assert.equal(parsedBody.data.position, parsedListColumnsResponse.data.data[0].position);
        assert.equal(parsedBody.data.projectId, parsedListColumnsResponse.data.data[0].projectId);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
        assert.equal('updatedAt' in parsedBody.data, false);
    });

    void it('reject update duplicate column name', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseAdmin = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseAdmin.body.data.user.id, WorkspaceRole.admin);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = {
            name: parsedListColumnsResponse.data.data[0].name,
            type: ColumnType.done,
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 409);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Duplicate name is not allowed');
        assert.equal(parsedBody.code, 'DUPLICATE_COLUMN_NAME');
    });

    void it('re_order column successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseAdmin = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseAdmin.body.data.user.id, WorkspaceRole.admin);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = parsedListColumnsResponse.data.data.map((column) => ({
            id: column.id,
            position: column.position + 1
        }));

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/re_order`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsedBody = okEnvelopeSchema(safeColumnsSchema).parse(body);

        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.data.length, payload.length);
        assert.ok(parsedBody.data.data.every((column) => column.position === payload.find((payloadColumn) => payloadColumn.id === column.id)!.position));

        assert.equal('deletedAt' in parsedBody.data.data[0], false);
        assert.equal('updatedAt' in parsedBody.data.data[0], false);
    });
    // reject reorder thiếu column
    void it('reject re_order when missing column', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const registerAndLoginResponseAdmin = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseAdmin.body.data.user.id, WorkspaceRole.admin);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = parsedListColumnsResponse.data.data.filter((column) => column.id !== parsedListColumnsResponse.data.data[0].id).map((column) => ({
            id: column.id,
            position: column.position + 1
        }));

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/re_order`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'not found in request');
        assert.equal(parsedBody.code, 'NOT_FOUND_IN_REQUEST');
    });

    void it('reject re_order columns not in project', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const createProjectResponse2 = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse2.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse2.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse2.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse2.body.data, false);
        assert.equal('updatedAt' in createProjectResponse2.body.data, false);

        const registerAndLoginResponseAdmin = await registerAndLogin(testServer);

        await addWorkspaceMember(createWorkspaceResponse.body.data.id, registerAndLoginResponseAdmin.body.data.user.id, WorkspaceRole.admin);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = parsedListColumnsResponse.data.data.filter((column) => column.id !== parsedListColumnsResponse.data.data[0].id).map((column) => ({
            id: column.id,
            position: column.position + 1
        }));

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse2.body.data.id}/re_order`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 404);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'not found in database');
        assert.equal(parsedBody.code, 'NOT_FOUND_IN_DATABASE');
    });

    void it('reject re_order duplicate columnId', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = parsedListColumnsResponse.data.data.map((column) => ({
            id: column.id,
            position: column.position + 1
        }));

        const duplicatePayload = parsedListColumnsResponse.data.data.map((item, index) =>
            index === payload.length - 1 ? { ...item, id: payload[0].id } : item
        )

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/re_order`, {
            method: 'PATCH',
            body: JSON.stringify(duplicatePayload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject re_order duplicate position', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = parsedListColumnsResponse.data.data.map((column) => ({
            id: column.id,
            position: column.position + 1
        }));

        const duplicatePayload = parsedListColumnsResponse.data.data.map((item, index) =>
            index === payload.length - 1 ? { ...item, position: payload[0].position } : item
        )

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/re_order`, {
            method: 'PATCH',
            body: JSON.stringify(duplicatePayload),
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);
        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('delete column successfully', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnsResponse.data.data[0].id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(res.status, 204);

        const parsedBody = okEnvelopeSchema(safeColumnSchema).parse(body);
        assert.equal(parsedBody.ok, true);
        assert.equal(parsedBody.data.id, parsedListColumnsResponse.data.data[0].id);
        assert.equal(parsedBody.data.name, parsedListColumnsResponse.data.data[0].name);
        assert.equal(parsedBody.data.position, parsedListColumnsResponse.data.data[0].position);
        assert.equal(parsedBody.data.type, parsedListColumnsResponse.data.data[0].type);
        assert.equal(parsedBody.data.projectId, parsedListColumnsResponse.data.data[0].projectId);
        assert.equal(parsedBody.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(parsedBody.data.createdAt.getTime()), false);
        assert.equal('deletedAt' in parsedBody.data, false);
        assert.equal('updatedAt' in parsedBody.data, false);
    });

    void it('reject when create greater than 10 columns', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnsResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            }
        });

        assert.equal(listColumnsResponse.res.status, 200);

        const parsedListColumnsResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnsResponse.body);

        assert.equal(parsedListColumnsResponse.ok, true);
        assert.ok(parsedListColumnsResponse.data.data.length > 0);

        const payload = [];

        while (payload.length < 11) {
            payload.push({
                name: `Column ${randomUUID()}`,
                type: ColumnType.todo,
            });
        }

        while (payload.length > 1) {
            await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
                },
                body: JSON.stringify(payload.pop()),
            })
        }

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            },
            body: JSON.stringify(payload.pop()),
        });

        assert.equal(res.status, 409);

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Maximum number of columns reached');
        assert.equal(parsedBody.code, 'MAX_COLUMNS_REACHED');
    });

    void it('reject create column missing name', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            },
            body: JSON.stringify({
                type: ColumnType.todo,
            }),
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject create column name too short', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            },
            body: JSON.stringify({
                name: 'a',
                type: ColumnType.todo,
            }),
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject create column with wrong type', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const payload = {
            name: `Column with wrong type`,
            type: 'worng-type',
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            },
            body: JSON.stringify({ payload }),
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    void it('reject update body with strange field', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);

        const createWorkspaceResponse = await createWorkspace(testServer, registerAndLoginResponse.body.data.accessToken);

        assert.equal(createWorkspaceResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);

        const createProjectResponse = await createProject(testServer, registerAndLoginResponse.body.data.accessToken, createWorkspaceResponse.body.data.id);

        assert.equal(createProjectResponse.body.data.createdBy, registerAndLoginResponse.body.data.user.id);
        assert.equal(createProjectResponse.body.data.createdAt instanceof Date, true);
        assert.equal(Number.isNaN(createProjectResponse.body.data.createdAt.getTime()), false);

        assert.equal('deletedAt' in createProjectResponse.body.data, false);
        assert.equal('updatedAt' in createProjectResponse.body.data, false);

        const listColumnResponse = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            },
        });

        assert.equal(listColumnResponse.res.status, 200);

        const parsedListColumnResponse = okEnvelopeSchema(safeColumnsSchema).parse(listColumnResponse.body);

        assert.equal(parsedListColumnResponse.ok, true);
        assert.ok(parsedListColumnResponse.data.data.length > 0);

        const payload = {
            name: `Column with strange field`,
            "position": 99
        };

        const { res, body } = await jsonRequest(testServer, `/api/columns/${createWorkspaceResponse.body.data.id}/${createProjectResponse.body.data.id}/${parsedListColumnResponse.data.data[0].id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
            },
            body: JSON.stringify({ payload }),
        });

        assert.equal(res.status, 400);

        const parsedBody = failEnvelopeSchema.parse(body);

        assert.equal(parsedBody.ok, false);
        assert.equal(parsedBody.message, 'Invalid request body');
        assert.equal(parsedBody.code, 'VALIDATION_ERROR');
    });

    // Reject unauthenticated create/list/get/update/delete/reorder
});
