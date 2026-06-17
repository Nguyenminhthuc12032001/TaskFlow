import { describe, it } from "node:test";
import { updateResponseSchema, type SafeWorkspaceUpdateResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

void describe('updateResponseSchema', () => {
    void it('accept valid payload', async (t) => {
        const validPayload: SafeWorkspaceUpdateResponse = {
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
                const result = updateResponseSchema.safeParse(testCase.payload);
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

    void it('rejects invalid fields', async (t) => {
        const validPayload: SafeWorkspaceUpdateResponse = {
            id: randomUUID(),
            name: 'Test Workspace',
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const invalidCaseByField: InvalidCasesByField<SafeWorkspaceUpdateResponse> = {
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
        }> = createSingleInvalidFieldCases(validPayload, invalidCaseByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format');
                assert.equal(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const validPayload: SafeWorkspaceUpdateResponse = {
            id: randomUUID(),
            name: 'Test Workspace',
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeWorkspaceUpdateResponse>;
        }> = createMissingRequiredFieldCases(updateResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type'), true);
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects unknown/multiple-unknown fields', async (t) => {
        const validPayload: SafeWorkspaceUpdateResponse = {
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
                const result = updateResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
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
        }> = invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
            title: `rejects invalid payload type ${test.label}`,
            payload: test.value
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});