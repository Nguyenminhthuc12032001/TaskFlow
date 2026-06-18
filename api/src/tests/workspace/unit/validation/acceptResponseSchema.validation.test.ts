import { describe, it } from "node:test";
import { acceptResponseSchema, type AcceptResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { WorkspaceRole } from "../../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonArrayValues, invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

void describe('acceptResponseSchema', () => {
    void it('accept valid payload', async (t) => {
        const validPayload: AcceptResponse = {
            role: WorkspaceRole.member,
            userId: `${randomUUID()}`,
            workspaceId: `${randomUUID()}`,
            joinedAt: new Date()
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept normal valid payload',
                    payload: validPayload
                },
                {
                    title: 'accept valid payload date ISO string',
                    payload: {
                        ...validPayload,
                        joinedAt: validPayload.joinedAt.toISOString()
                    }
                },
                ...Object.values(WorkspaceRole).map((role) => {
                    return {
                        title: `accept valid payload with role ${role}`,
                        payload: {
                            ...validPayload,
                            role
                        }
                    }
                })
            ]
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = acceptResponseSchema.safeParse(testCase.payload);
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

    void it('rejects missing reuqired fields', async (t) => {
        const validPayload: AcceptResponse = {
            role: WorkspaceRole.member,
            userId: `${randomUUID()}`,
            workspaceId: `${randomUUID()}`,
            joinedAt: new Date()
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof AcceptResponse>;
        }> = createMissingRequiredFieldCases(acceptResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = acceptResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type' || code === 'invalid_value'), true);
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const validPayload: AcceptResponse = {
            role: WorkspaceRole.member,
            userId: `${randomUUID()}`,
            workspaceId: `${randomUUID()}`,
            joinedAt: new Date()
        };

        const invalidCasesByField: InvalidCasesByField<AcceptResponse> = {
            role: invalidNonStringValues,
            userId: invalidNonUUIDValues,
            workspaceId: invalidNonUUIDValues,
            joinedAt: invalidNonDateValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = acceptResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_value' || issue.code === 'invalid_format');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
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
                const result = acceptResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects unknown/mutiple fields', async (t) => {
        const validPayload: AcceptResponse = {
            role: WorkspaceRole.member,
            userId: `${randomUUID()}`,
            workspaceId: `${randomUUID()}`,
            joinedAt: new Date()
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
                        unknownField: 'unknown'
                    },
                    unrecognizedKeys: ['unknownField']
                },
                {
                    title: 'rejects multiple unknown fields',
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
                const result = acceptResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                const code = issue.code;
                assert.deepStrictEqual(issue.path, []);
                assert.ok(code === 'unrecognized_keys');
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issue.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });
});