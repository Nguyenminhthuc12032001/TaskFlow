import { describe, it } from "node:test";
import { workspaceListItemResponseSchema, type SafeWorkspaceListItemResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { randomUUID } from "node:crypto";
import { WorkspaceRole } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

void describe('workspaceListItemResponseSchema', () => {
    void it('accept valid payload', async (t) => {
        const validPayload: SafeWorkspaceListItemResponse = {
            id: `${randomUUID()}`,
            name: 'Test Workspace',
            createdBy: `${randomUUID()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdByName: 'Admin User',
            role: WorkspaceRole.member
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...Object.values(WorkspaceRole).map((role) => {
                    return {
                        title: `accept valid payload with role ${role}`,
                        payload: {
                            ...validPayload,
                            role
                        }
                    }
                }),
                {
                    title: 'accept valid payload date ISO string',
                    payload: {
                        ...validPayload,
                        createdAt: validPayload.createdAt.toISOString(),
                        updatedAt: validPayload.updatedAt.toISOString()
                    }
                },
                {
                    title: 'accept normal valid payload',
                    payload: validPayload
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = workspaceListItemResponseSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title !== 'accept normal valid payload') {
                    if (testCase.title === 'accept valid payload date ISO string') {
                        assert.deepStrictEqual(result.data, validPayload);
                    }
                    else {
                        assert.deepStrictEqual(result.data, testCase.payload);
                    }
                }
            })
        }
    });

    void it('rejects invalid field', async (t) => {
        const validPayload: SafeWorkspaceListItemResponse = {
            id: `${randomUUID()}`,
            name: 'Test Workspace',
            createdBy: `${randomUUID()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdByName: 'Admin User',
            role: WorkspaceRole.member
        };

        const invalidCaseByField: InvalidCasesByField<SafeWorkspaceListItemResponse> = {
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            createdBy: invalidNonUUIDValues,
            createdAt: invalidNonDateValues,
            updatedAt: invalidNonDateValues,
            createdByName: invalidNonStringValues,
            role: invalidNonStringValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                ...createSingleInvalidFieldCases(validPayload, invalidCaseByField)
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = workspaceListItemResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.equal(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid role', async (t) => {
        const validPayload: SafeWorkspaceListItemResponse = {
            id: `${randomUUID()}`,
            name: 'Test Workspace',
            createdBy: `${randomUUID()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdByName: 'Admin User',
            role: WorkspaceRole.member
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                ...Object.values(WorkspaceRole).map((role) => {
                    return {
                        title: `rejects invalid role ${role} uppercase`,
                        payload: {
                            ...validPayload,
                            role: role.toUpperCase()
                        },
                        invalidField: 'role'
                    }
                })
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = workspaceListItemResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_value');
                assert.equal(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects when missing required fields', async (t) => {
        const validPayload: SafeWorkspaceListItemResponse = {
            id: `${randomUUID()}`,
            name: 'Test Workspace',
            createdBy: `${randomUUID()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdByName: 'Admin User',
            role: WorkspaceRole.member
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeWorkspaceListItemResponse>;
        }> = createMissingRequiredFieldCases(workspaceListItemResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = workspaceListItemResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const paths = issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(paths.sort(), [...testCase.missingFields].sort());

                for (const missingField of testCase.missingFields) {
                    const issue = issues.find((issue) => issue.path[0] === missingField);
                    assert.ok(issue);
                    if (missingField === 'role') {
                        assert.ok(issue.code === 'invalid_value');
                    }
                    else {
                        assert.ok(issue.code === 'invalid_type');
                    }
                }
            })
        }
    });

    void it('rejects unknown/multiple-unknown fields', async (t) => {
        const validPayload: SafeWorkspaceListItemResponse = {
            id: `${randomUUID()}`,
            name: 'Test Workspace',
            createdBy: `${randomUUID()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdByName: 'Admin User',
            role: WorkspaceRole.member
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown'
                    },
                    unrecognizedKeys: ['unknown']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    },
                    unrecognizedKeys: ['unknown1', 'unknown2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = workspaceListItemResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });

    void it('rejects when invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonObjectValues.map((test) => ({
                    title: `rejects invalid payload type ${test.label}`,
                    payload: test.value
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = workspaceListItemResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
            })
        }
    });
});