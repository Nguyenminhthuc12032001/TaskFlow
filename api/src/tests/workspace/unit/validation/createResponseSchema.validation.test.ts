import { describe, it } from "node:test";
import { createResponseSchema, type SafeWorkspaceResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, getKeyCombinations, omitFields, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

void describe('createResponseSchema', async () => {
    void it('accept valid payload', async (t) => {
        const validPayload: SafeWorkspaceResponse = {
            id: `${randomUUID()}`,
            name: 'Test Workspace',
            createdBy: `${randomUUID()}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept name with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `
                    }
                },
                {
                    title: 'accept date ISO string',
                    payload: {
                        ...validPayload,
                        createdAt: validPayload.createdAt.toISOString(),
                        updatedAt: validPayload.updatedAt.toISOString()
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createResponseSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                assert.deepEqual(result.data, validPayload);
            })
        }
    });

    void it('rejects when missing required fields', async (t) => {
        const validPayload: SafeWorkspaceResponse = {
            id: `${randomUUID()}`,
            name: 'Test Workspace',
            createdBy: `${randomUUID()}`,
            createdAt: new Date(),
            updatedAt: new Date()
        } 

        const cases: Array<{
            title: string,
            payload: Partial<SafeWorkspaceResponse>,
            missingFields: Array<keyof SafeWorkspaceResponse>
        }> = createMissingRequiredFieldCases(createResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createResponseSchema.safeParse(testCase.payload);
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
        const validPayload: SafeWorkspaceResponse = {
            id: `${randomUUID()}`,
            name: 'Test Workspace',
            createdBy: `${randomUUID()}`,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const invalidCasesByField: InvalidCasesByField<SafeWorkspaceResponse> = {
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            createdBy: invalidNonUUIDValues,
            createdAt: invalidNonDateValues,
            updatedAt: invalidNonDateValues
        }

        const cases = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format');
                assert.equal(issues.path[0], testCase.invalidField);
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
                const result = createResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});