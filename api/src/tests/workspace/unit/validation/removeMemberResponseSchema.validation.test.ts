import { describe, it } from "node:test";
import { removeMemberResponseSchema, type RemoveMemberResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { randomUUID } from "node:crypto";
import { WorkspaceRole } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: RemoveMemberResponse = {
    userId: `${randomUUID()}`,
    deletedAt: new Date(),
    workspaceId: `${randomUUID()}`,
    role: WorkspaceRole.member,
    joinedAt: new Date()
};

void describe('removeMemberResponseSchema', () => {
    void it('accept valid payload', async (t) => {
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
                        deletedAt: validPayload.deletedAt.toISOString(),
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
                const result = removeMemberResponseSchema.safeParse(testCase.payload);
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

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof RemoveMemberResponse>;
        }> = createMissingRequiredFieldCases(removeMemberResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = removeMemberResponseSchema.safeParse(testCase.payload);
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
        const invalidCasesByField: InvalidCasesByField<RemoveMemberResponse> = {
            userId: invalidNonUUIDValues,
            deletedAt: invalidNonDateValues,
            workspaceId: invalidNonUUIDValues,
            role: invalidNonStringValues,
            joinedAt: invalidNonDateValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = removeMemberResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
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
                const result = removeMemberResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects unknown/multiple fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'rejects unknown field',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown'
                    },
                    unrecognizedKeys: ['unknown']
                },
                {
                    title: 'rejects multiple fields',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown',
                        anotherUnknown: 'anotherUnknown'
                    },
                    unrecognizedKeys: ['unknown', 'anotherUnknown']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = removeMemberResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issue = result.error!.issues[0];
                assert.equal(issue.code, 'unrecognized_keys');
                assert.deepStrictEqual(issue.path, []);
                if (issue.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issue.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });
});