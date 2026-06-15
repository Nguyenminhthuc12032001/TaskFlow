import { describe, it } from "node:test";
import { inviteBodySchema, type InviteBody } from "../../../../modules/workspace/workspace.schemas.js";
import { randomUUID } from "node:crypto";
import { WorkspaceRole } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { invalidNonEnumValues, invalidNonObjectValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

void describe('inviteBodySchema', () => {
    void it('accept valid payload', async () => {
        const validPayload: InviteBody = {
            userId: `${randomUUID()}`,
            role: WorkspaceRole.member
        };

        const cases: Array<{
            title: string;
            payload: InviteBody;
        }> = [
                {
                    title: 'accept valid payload',
                    payload: validPayload
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
            await it(testCase.title, async () => {
                const result = inviteBodySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                assert.deepStrictEqual(result.data, testCase.payload);
            })
        }
    });

    void it('rejects when missing required fields', async (t) => {
        const cases: Array<{
            title: string,
            payload: Partial<InviteBody>,
            missingFields: Array<keyof InviteBody>
        }> = [
                {
                    title: 'missing userId',
                    payload: {
                        role: WorkspaceRole.member
                    },
                    missingFields: ['userId']
                },
                {
                    title: 'missing role',
                    payload: {
                        userId: `${randomUUID()}`
                    },
                    missingFields: ['role']
                },
                {
                    title: 'missing both userId and role',
                    payload: {},
                    missingFields: ['userId', 'role']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                if (testCase.missingFields.includes('userId') && !testCase.missingFields.includes('role')) {
                    assert.equal(issues.every((issue) => issue.code === 'invalid_type'), true);
                }
                else if (testCase.missingFields.includes('role') && !testCase.missingFields.includes('userId')) {
                    assert.equal(issues.every((issue) => issue.code === 'invalid_value'), true);
                }
                else {
                    assert.equal(issues.every((issue) => issue.code === 'invalid_type' || issue.code === 'invalid_value'), true);
                }
                assert.deepStrictEqual(issues.map((issue) => issue.path[0]), testCase.missingFields);
            })
        }
    });

    void it('rejects non-uuid userId', async (t) => {
        const cases: Array<{
            title: string;
            payload: Partial<InviteBody>;
            invalidFields: Array<keyof InviteBody>;
        }> = [
                {
                    title: 'rejects non-uuid userId',
                    payload: {
                        userId: 'invalid-uuid',
                        role: WorkspaceRole.member
                    },
                    invalidFields: ['userId']
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                assert.ok(result.error)
                const paths = result.error.issues.map((issue) => issue.path[0]);
                const codes = result.error.issues.map((issue) => issue.code);
                assert.deepStrictEqual(paths, testCase.invalidFields);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_format'), true);
            });
        }
    });

    void it('rejects invalid role', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonEnumValues.map((value) => ({
                    title: `rejects invalid role ${value.label}`,
                    payload: {
                        userId: `${randomUUID()}`,
                        role: value.value
                    },
                })),
                ...Object.values(WorkspaceRole).map((role) => ({
                    title: `rejects invalid role ${role}`,
                    payload: {
                        userId: `${randomUUID()}`,
                        role: role.toUpperCase()
                    },
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                assert.ok(result.error)
                const paths = result.error.issues.map((issue) => issue.path[0]);
                const codes = result.error.issues.map((issue) => issue.code);
                assert.deepStrictEqual(paths, ['role']);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_value'), true);
            })
        }
    });

    void it('rejects combined invalid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonEnumValues.flatMap((value) =>
                    invalidNonUUIDValues.map((uuid) => ({
                        title: `rejects invalid payload with role ${value.label} and userId ${uuid.label}`,
                        payload: {
                            userId: uuid.value,
                            role: value.value
                        }
                    }))
                ),
                ...Object.values(WorkspaceRole).flatMap((role) =>
                    invalidNonUUIDValues.map((uuid) => ({
                        title: `rejects invalid payload with role ${role} and userId ${uuid.label}`,
                        payload: {
                            userId: uuid.value,
                            role: role.toUpperCase()
                        }
                    }))
                )
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                assert.ok(result.error)
                const paths = result.error.issues.map((issue) => issue.path[0]);
                const codes = result.error.issues.map((issue) => issue.code);
                assert.deepStrictEqual(paths.sort(), ['userId', 'role'].sort());
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_format' || code === 'invalid_value' || code === 'invalid_type'), true);
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
                const result = inviteBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: {
                        userId: `${randomUUID()}`,
                        role: WorkspaceRole.member,
                        unknown: 'unknown'
                    },
                    unrecognizedKeys: ['unknown']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        userId: `${randomUUID()}`,
                        role: WorkspaceRole.member,
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    },
                    unrecognizedKeys: ['unknown1', 'unknown2']
                }
            ]
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteBodySchema.safeParse(testCase.payload);
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
});