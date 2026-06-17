import { describe, it } from "node:test";
import { deleteResponseSchema, type SafeWorkspaceDeleteResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

void describe('deleteResponseSchema', () => {
    void it('accept valid payload', async (t) => {
        const validPayload: SafeWorkspaceDeleteResponse = {
            id: randomUUID(),
            name: 'Test Workspace',
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept normal payload',
                    payload: validPayload
                },
                {
                    title: 'accept valid payload date ISO string',
                    payload: {
                        ...validPayload,
                        createdAt: validPayload.createdAt.toISOString(),
                        updatedAt: validPayload.updatedAt.toISOString()
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = deleteResponseSchema.safeParse(testCase.payload);
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

    void it('rejetcs missing required fields', async (t) => {
        const validPayload: SafeWorkspaceDeleteResponse = {
            id: randomUUID(),
            name: 'Test Workspace',
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeWorkspaceDeleteResponse>;
        }> = createMissingRequiredFieldCases(deleteResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = deleteResponseSchema.safeParse(testCase.payload);
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
        const validPayload: SafeWorkspaceDeleteResponse = {
            id: randomUUID(),
            name: 'Test Workspace',
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const invalidCasesByField: InvalidCasesByField<SafeWorkspaceDeleteResponse> = {
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            createdBy: invalidNonUUIDValues,
            createdAt: invalidNonDateValues,
            updatedAt: invalidNonDateValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = deleteResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects unknown/multiple-unknown fields', async (t) => {
        const validPayload: SafeWorkspaceDeleteResponse = {
            id: randomUUID(),
            name: 'Test Workspace',
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'reject unknown field',
                    payload: {
                        ...validPayload,
                        unknownField: 'unknown'
                    },
                    unrecognizedKeys: ['unknownField']
                },
                {
                    title: 'reject multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField1: 'unknown',
                        unknownField2: 'unknown'
                    },
                    unrecognizedKeys: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = deleteResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                const code = issue.code;
                const path = issue.path;
                assert.equal(code, 'unrecognized_keys');
                assert.deepStrictEqual(path, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issue.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
                    title: `rejects invalid payload type ${test.label}`,
                    payload: test.value
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = deleteResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});