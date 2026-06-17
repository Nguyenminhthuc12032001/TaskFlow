import { describe, it } from "node:test";
import { safeMemberResponseSchema, type SafeMemberResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { randomUUID } from "node:crypto";
import { WorkspaceRole } from "../../../../../prisma/generated/enums.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, type InvalidCasesByField } from "../../../helper.js";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonBooleanValues, invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

void describe('safeMemberResponseSchema', () => {
    void it('accept valid payload', async (t) => {
        const payload: SafeMemberResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: uniqueEmail(),
            },
            role: WorkspaceRole.member,
            joinedAt: new Date()
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept normal payload',
                    payload
                },
                {
                    title: 'accept valid payload date ISO string',
                    payload: {
                        ...payload,
                        joinedAt: payload.joinedAt.toISOString()
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeMemberResponseSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title !== 'accept normal valid payload') {
                    if (testCase.title === 'accept valid payload date ISO string') {
                        assert.deepStrictEqual(result.data, payload);
                    }
                    else {
                        assert.deepStrictEqual(result.data, testCase.payload);
                    }
                }
            })
        }
    });

    void it('rejects invalid role uppercase', async (t) => {
        const validPayload: SafeMemberResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: uniqueEmail(),
            },
            role: WorkspaceRole.member,
            joinedAt: new Date()
        }

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...Object.values(WorkspaceRole).map((role) => ({
                    title: `rejects invalid role ${role} uppercase`,
                    payload: {
                        ...validPayload,
                        role: role.toUpperCase()
                    }
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeMemberResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], 'role');
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidPayload: SafeMemberResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: uniqueEmail(),
            },
            role: WorkspaceRole.member,
            joinedAt: new Date()
        }

        const invalidCasesByField: InvalidCasesByField<SafeMemberResponse> = {
            user: invalidNonObjectValues.filter((testCase) => typeof testCase.value !== 'object'),
            role: [...invalidNonObjectValues, ...invalidNonStringValues, ...invalidNonArrayValues, ...invalidNonBooleanValues, ...invalidNonDateValues],
            joinedAt: invalidNonDateValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(invalidPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeMemberResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid user fields', async (t) => {
        const validPayload: SafeMemberResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: uniqueEmail(),
            },
            role: WorkspaceRole.member,
            joinedAt: new Date()
        };

        const invalidUserCasesByField: InvalidCasesByField<SafeMemberResponse['user']> = {
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            email: invalidNonStringValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.user, invalidUserCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeMemberResponseSchema.safeParse({
                    ...validPayload,
                    user: testCase.payload
                });
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], 'user');
                assert.deepStrictEqual(issues.path[1], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const validPayload: SafeMemberResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: uniqueEmail(),
            },
            role: WorkspaceRole.member,
            joinedAt: new Date()
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeMemberResponse>;
        }> = createMissingRequiredFieldCases(safeMemberResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeMemberResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects invalid missing user required fields', async (t) => {
        const validPayload: SafeMemberResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: uniqueEmail(),
            },
            role: WorkspaceRole.member,
            joinedAt: new Date()
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeMemberResponse['user']>;
        }> = createMissingRequiredFieldCases(safeMemberResponseSchema.shape.user, validPayload.user).map((testCase) => ({
            ...testCase,
            payload: {
                ...validPayload,
                user: testCase.payload
            }
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeMemberResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[1]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects unknown/multiple-unknown fields', async (t) => {
        const validPayload: SafeMemberResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: uniqueEmail(),
            },
            role: WorkspaceRole.member,
            joinedAt: new Date()
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            unknownFields: Array<string>;
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField: 'unknown'
                    },
                    unknownFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField1: 'unknown',
                        unknownField2: 'unknown'
                    },
                    unknownFields: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeMemberResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                const code = issue.code;
                const path = issue.path;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(path, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issue.keys, testCase.unknownFields);
                }
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const validPayload: SafeMemberResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: uniqueEmail(),
            },
            role: WorkspaceRole.member,
            joinedAt: new Date()
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
            title: `rejects invalid payload type ${test.label}`,
            payload: test.value
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeMemberResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});