import { describe, it } from "node:test";
import { inviteResponseSchema, type InviteResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { randomUUID } from "node:crypto";
import { WorkspaceRole } from "../../../../../prisma/generated/enums.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, type InvalidCasesByField } from "../../../helper.js";
import assert from "node:assert";
import { invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

void describe("inviteResponseSchema", () => {
    void it('accept valid payload', async (t) => {
        const validPayload: InviteResponse = {
            id: `${randomUUID()}`,
            workspaceId: `${randomUUID()}`,
            email: uniqueEmail(),
            role: WorkspaceRole.member,
            jti: `${randomUUID()}`,
            tokenHash: `${randomUUID()}`,
            createdAt: new Date(),
            createdBy: `${randomUUID()}`,
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
                        createdAt: validPayload.createdAt.toISOString()
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
                }),
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteResponseSchema.safeParse(testCase.payload);
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
        const validPayload: InviteResponse = {
            id: `${randomUUID()}`,
            workspaceId: `${randomUUID()}`,
            email: uniqueEmail(),
            role: WorkspaceRole.member,
            jti: `${randomUUID()}`,
            tokenHash: `${randomUUID()}`,
            createdAt: new Date(),
            createdBy: `${randomUUID()}`,
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof InviteResponse>;
        }> = createMissingRequiredFieldCases(inviteResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteResponseSchema.safeParse(testCase.payload);
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
        const validPayload: InviteResponse = {
            id: `${randomUUID()}`,
            workspaceId: `${randomUUID()}`,
            email: uniqueEmail(),
            role: WorkspaceRole.member,
            jti: `${randomUUID()}`,
            tokenHash: `${randomUUID()}`,
            createdAt: new Date(),
            createdBy: `${randomUUID()}`,
        };

        const invalidCaseByField: InvalidCasesByField<InviteResponse> = {
            id: invalidNonUUIDValues,
            workspaceId: invalidNonUUIDValues,
            email: invalidNonStringValues,
            role: invalidNonStringValues,
            jti: invalidNonUUIDValues,
            tokenHash: invalidNonStringValues,
            createdAt: invalidNonDateValues,
            createdBy: invalidNonUUIDValues,
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCaseByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects unknown/multiple-unknown fields', async (t) => {
        const validPayload: InviteResponse = {
            id: `${randomUUID()}`,
            workspaceId: `${randomUUID()}`,
            email: uniqueEmail(),
            role: WorkspaceRole.member,
            jti: `${randomUUID()}`,
            tokenHash: `${randomUUID()}`,
            createdAt: new Date(),
            createdBy: `${randomUUID()}`,
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'rejects unknown field',
                    payload: {
                        ...validPayload,
                        foo: 'bar'
                    },
                    unrecognizedKeys: ['foo']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        foo: 'bar',
                        bar: 'baz'
                    },
                    unrecognizedKeys: ['foo', 'bar']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.deepStrictEqual(issues.path, []);
                assert.ok(issues.code === 'unrecognized_keys');
                assert.deepStrictEqual(issues.keys, testCase.unrecognizedKeys);
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
                const result = inviteResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    })
});