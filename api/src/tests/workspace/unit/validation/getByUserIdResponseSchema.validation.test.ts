import { describe, it } from "node:test";
import { getByUserIdResponseSchema, workspaceListItemResponseSchema, type SafeWorkspacesResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { WorkspaceRole } from "../../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonArrayValues, invalidNonBooleanValues, invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js"; 
import { paginationMetaSchema } from "../../../../common/schemas/common.schemas.js";

void describe('getByUserIdResponseSchema', () => {
    void it('accept valid payload', async (t) => {
        const validPayload: SafeWorkspacesResponse = {
            data: [{
                id: `${randomUUID()}`,
                name: 'Test Workspace',
                createdBy: `${randomUUID()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdByName: 'Admin User',
                role: WorkspaceRole.member
            },
            {
                id: `${randomUUID()}`,
                name: 'Test Workspace',
                createdBy: `${randomUUID()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdByName: 'Admin User',
                role: WorkspaceRole.member
            }],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 2,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        const cases: Array<{
            title: string,
            payload: unknown;
        }> = [
                {
                    title: 'accept normal payload',
                    payload: validPayload,
                },
                {
                    title: 'accept valid payload date ISO string',
                    payload: {
                        data: [
                            {
                                ...validPayload.data[0],
                                createdAt: validPayload.data[0].createdAt.toISOString(),
                                updatedAt: validPayload.data[0].updatedAt.toISOString()
                            },
                            {
                                ...validPayload.data[1],
                                createdAt: validPayload.data[1].createdAt.toISOString(),
                                updatedAt: validPayload.data[1].updatedAt.toISOString()
                            }
                        ],
                        paginationMeta: validPayload.paginationMeta
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = getByUserIdResponseSchema.safeParse(testCase.payload);
                assert.ok(result.success);

                if (testCase.title === 'accept valid payload date ISO string') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects when missing required fields', async (t) => {
        const validPayload: SafeWorkspacesResponse = {
            data: [{
                id: `${randomUUID()}`,
                name: 'Test Workspace',
                createdBy: `${randomUUID()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdByName: 'Admin User',
                role: WorkspaceRole.member
            }],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeWorkspacesResponse>;
        }> = createMissingRequiredFieldCases(getByUserIdResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = getByUserIdResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type'), true);
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const validPayload: SafeWorkspacesResponse = {
            data: [{
                id: `${randomUUID()}`,
                name: 'Test Workspace',
                createdBy: `${randomUUID()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdByName: 'Admin User',
                role: WorkspaceRole.member
            }],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        const invalidDataCasesByField: InvalidCasesByField<SafeWorkspacesResponse['data'][number]> = {
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            createdBy: invalidNonUUIDValues,
            createdAt: invalidNonDateValues,
            updatedAt: invalidNonDateValues,
            createdByName: invalidNonStringValues,
            role: invalidNonStringValues
        }

        const invalidPaginationMetaCasesByField: InvalidCasesByField<SafeWorkspacesResponse['paginationMeta']> = {
            page: invalidNonNumberValues,
            limit: invalidNonNumberValues,
            totalItems: invalidNonNumberValues,
            totalPages: invalidNonNumberValues,
            hasNextPage: invalidNonBooleanValues,
            hasPrevPage: invalidNonBooleanValues
        }

        const cases: Array<{
            title: string;
            payload: {
                data: Array<Record<string, unknown>>;
                paginationMeta: Record<string, unknown>;
            };
            expectedPath: Array<string | number>;
        }> = [
                ...createSingleInvalidFieldCases(validPayload.data[0], invalidDataCasesByField).map((testCase) => ({
                    title: `rejects data: ${testCase.invalidField}`,
                    payload: {
                        data: [testCase.payload],
                        paginationMeta: validPayload.paginationMeta
                    },
                    expectedPath: ['data', 0, testCase.invalidField]
                })),
                ...createSingleInvalidFieldCases(validPayload.paginationMeta, invalidPaginationMetaCasesByField).map((testCase) => ({
                    title: `rejects paginationMeta: ${testCase.invalidField}`,
                    payload: {
                        data: validPayload.data,
                        paginationMeta: testCase.payload
                    },
                    expectedPath: ['paginationMeta', testCase.invalidField]
                })),
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = getByUserIdResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_format' || issue.code === 'invalid_value');
                assert.deepStrictEqual(issue.path, testCase.expectedPath);
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;

        }> = [
                ...invalidNonObjectValues.filter((testCase) => typeof testCase.value !== 'object').map((testCase) => ({
                    title: `rejects invalid payload type ${testCase.label}`,
                    payload: testCase.value,
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = getByUserIdResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_format' || issue.code === 'invalid_value');
                assert.deepStrictEqual(issue.path, []);
            })
        }
    })

    void it('rejects invalid data type', async (t) => {
        const validPayload: SafeWorkspacesResponse = {
            data: [{
                id: `${randomUUID()}`,
                name: 'Test Workspace',
                createdBy: `${randomUUID()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdByName: 'Admin User',
                role: WorkspaceRole.member
            }],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        const cases: Array<{
            title: string,
            payload: {
                data: unknown;
                paginationMeta: SafeWorkspacesResponse['paginationMeta'];
            },
            expectedPath: Array<string | number>;
        }> = [
                ...invalidNonArrayValues.map((testCase) => ({
                    title: `rejects data: ${testCase.label}`,
                    payload: {
                        data: testCase.value,
                        paginationMeta: validPayload.paginationMeta
                    },
                    expectedPath: ['data']
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = getByUserIdResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_format' || issue.code === 'invalid_value');
                assert.deepStrictEqual(issue.path, testCase.expectedPath);
            })
        }
    });

    void it('rejects invalid paginationMeta type', async (t) => {
        const validPayload: SafeWorkspacesResponse = {
            data: [{
                id: `${randomUUID()}`,
                name: 'Test Workspace',
                createdBy: `${randomUUID()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdByName: 'Admin User',
                role: WorkspaceRole.member
            }],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        const cases: Array<{
            title: string,
            payload: {
                data: SafeWorkspacesResponse['data'];
                paginationMeta: unknown;
            },
            expectedPath: Array<string | number>;
        }> = [
                ...invalidNonObjectValues.filter((testCase) => typeof testCase.value !== 'object').map((testCase) => ({
                    title: `rejects paginationMeta: ${testCase.label}`,
                    payload: {
                        data: validPayload.data,
                        paginationMeta: testCase.value
                    },
                    expectedPath: ['paginationMeta']
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = getByUserIdResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_format' || issue.code === 'invalid_value');
                assert.deepStrictEqual(issue.path, testCase.expectedPath);
            })
        }
    });

    void it('rejects missing required data fields', async (t) => {
        const validPayload: SafeWorkspacesResponse = {
            data: [{
                id: `${randomUUID()}`,
                name: 'Test Workspace',
                createdBy: `${randomUUID()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdByName: 'Admin User',
                role: WorkspaceRole.member
            }],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        const cases: Array<{
            title: string;
            payload: {
                data: unknown;
                paginationMeta: SafeWorkspacesResponse['paginationMeta'];
            };
            expectedPaths: Array<Array<string | number>>;
        }> = [
                ...createMissingRequiredFieldCases(workspaceListItemResponseSchema, validPayload.data[0]).map((testCase) => ({
                    title: `rejects missing required data: ${testCase.title}`,
                    payload: {
                        data: [testCase.payload],
                        paginationMeta: validPayload.paginationMeta
                    },
                    expectedPaths: testCase.missingFields.map((missingField) => ['data', 0, missingField])
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = getByUserIdResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                assert.ok(issues[0].code === 'invalid_type' || issues[0].code === 'invalid_format' || issues[0].code === 'invalid_value');
                const paths = issues.map((issue) => issue.path);
                assert.deepStrictEqual(
                    paths,
                    testCase.expectedPaths
                );
            })
        }
    });

    void it('rejects missing required paginationMeta fields', async (t) => {
        const validPayload: SafeWorkspacesResponse = {
            data: [{
                id: `${randomUUID()}`,
                name: 'Test Workspace',
                createdBy: `${randomUUID()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdByName: 'Admin User',
                role: WorkspaceRole.member
            }],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        const cases: Array<{
            title: string;
            payload: {
                data: SafeWorkspacesResponse['data'];
                paginationMeta: unknown;
            };
            expectedPaths: Array<Array<string | number>>;
        }> = [
                ...createMissingRequiredFieldCases(paginationMetaSchema, validPayload.paginationMeta).map((testCase) => ({
                    title: `rejects missing required paginationMeta: ${testCase.title}`,
                    payload: {
                        data: validPayload.data,
                        paginationMeta: testCase.payload
                    },
                    expectedPaths: testCase.missingFields.map((missingField) => ['paginationMeta', missingField])
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = getByUserIdResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                assert.ok(issues[0].code === 'invalid_type' || issues[0].code === 'invalid_format' || issues[0].code === 'invalid_value');
                const paths = issues.map((issue) => issue.path);
                assert.deepStrictEqual(
                    paths,
                    testCase.expectedPaths
                );
            })
        }
    });

    void it('rejects unknown/multiple-unknown fields', async (t) => {
        const validPayload: SafeWorkspacesResponse = {
            data: [{
                id: `${randomUUID()}`,
                name: 'Test Workspace',
                createdBy: `${randomUUID()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdByName: 'Admin User',
                role: WorkspaceRole.member
            }],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        const cases: Array<{
            title: string;
            payload: {
                data: SafeWorkspacesResponse['data'];
                paginationMeta: SafeWorkspacesResponse['paginationMeta'];
                [key: string]: unknown;
            };
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'rejects unknown field',
                    payload: {
                        data: validPayload.data,
                        paginationMeta: validPayload.paginationMeta,
                        unknownField: 'unknownValue'
                    },
                    unrecognizedKeys: ['unknownField']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        data: validPayload.data,
                        paginationMeta: validPayload.paginationMeta,
                        unknownField1: 'unknownValue1',
                        unknownField2: 'unknownValue2'
                    },
                    unrecognizedKeys: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = getByUserIdResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                assert.ok(issues.every((issue) => issue.code === 'unrecognized_keys'));
                assert.ok(issues.every((issue) => issue.path.length === 0));
                if (issues[0].code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues[0].keys, testCase.unrecognizedKeys);
                }
            })
        }
    });
});