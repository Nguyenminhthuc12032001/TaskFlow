import { describe, it } from "node:test";
import { listMemberByWorkspaceQuerySchema, type ListMemberByWorkspaceQuery } from "../../../../modules/workspace/workspace.schemas.js";
import { WorkspaceRole } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { randomInt } from "node:crypto";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

void describe("listMemberByWorkspaceQuerySchema", () => {
    void it("accept valid payload when empty fields", async (t) => {
        const today: Date = new Date();
        const yesterday: Date = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const validPayload: ListMemberByWorkspaceQuery = {
            startDate: yesterday,
            endDate: today,
            role: WorkspaceRole.member,
            page: 1,
            limit: 10,
            search: "test"
        };

        const cases: Array<{
            title: string;
            payload: ListMemberByWorkspaceQuery;

        }> = [
                {
                    title: "accept valid payload with full fields",
                    payload: validPayload,

                },
                {
                    title: 'accept valid payload without search',
                    payload: {
                        ...validPayload,
                        search: undefined
                    },

                },
                {
                    title: 'accept valid payload without page',
                    payload: {
                        ...validPayload,
                        page: undefined
                    },

                },
                {
                    title: 'accept valid payload without limit',
                    payload: {
                        ...validPayload,
                        limit: undefined
                    },

                },
                {
                    title: 'accept valid payload without startDate',
                    payload: {
                        ...validPayload,
                        startDate: undefined
                    },

                },
                {
                    title: 'accept valid payload without endDate',
                    payload: {
                        ...validPayload,
                        endDate: undefined
                    },

                },
                {
                    title: 'accept valid payload without role',
                    payload: {
                        ...validPayload,
                        role: undefined
                    },

                },
                {
                    title: 'accept valid payload without startDate and endDate',
                    payload: {
                        ...validPayload,
                        startDate: undefined,
                        endDate: undefined
                    },

                },
                {
                    title: 'accept valid payload without startDate and endDate and page',
                    payload: {
                        ...validPayload,
                        startDate: undefined,
                        endDate: undefined,
                        page: undefined
                    },

                },
                {
                    title: 'accept valid payload without startDate and endDate and role',
                    payload: {
                        ...validPayload,
                        startDate: undefined,
                        endDate: undefined,
                        role: undefined
                    },

                },
                {
                    title: 'accept valid payload without startDate and endDate and role and page',
                    payload: {
                        ...validPayload,
                        startDate: undefined,
                        endDate: undefined,
                        role: undefined,
                        page: undefined
                    },

                },
                {
                    title: 'accept valid payload without startDate and endDate and role and page and limit',
                    payload: {
                        ...validPayload,
                        startDate: undefined,
                        endDate: undefined,
                        role: undefined,
                        page: undefined,
                        limit: undefined
                    },

                },
                {
                    title: 'accept valid empty payload',
                    payload: {},

                },
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);

                if (testCase.title !== 'accept valid empty payload') {
                    assert.deepEqual(result.data, testCase.payload);
                }
            });
        }
    });

    void it('accept positive number page/limit', async (t) => {
        const cases: Array<{
            title: string;
            payload: ListMemberByWorkspaceQuery;
        }> = [
                {
                    title: 'accept positive number page',
                    payload: {
                        page: randomInt(1, 100),
                    }
                },
                {
                    title: 'accept positive number limit',
                    payload: {
                        limit: randomInt(1, 100)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);

                assert.deepStrictEqual(testCase.payload, result.data);
            })
        }
    });

    void it('rejects non-number page/limit', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonNumberValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid page ${test.label}`,
                    payload: {
                        page: test.value
                    }
                })),
                ...invalidNonNumberValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid limit ${test.label}`,
                    payload: {
                        limit: test.value
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('accept search normal, trimmed, empty, whitespace', async (t) => {
        const cases: Array<{
            title: string;
            payload: ListMemberByWorkspaceQuery;
        }> = [
                {
                    title: 'accept search normal',
                    payload: {
                        search: 'test'
                    }
                },
                {
                    title: 'accept search trimmed',
                    payload: {
                        search: '  test  '
                    }
                },
                {
                    title: 'accept search empty',
                    payload: {
                        search: ''
                    }
                }, {
                    title: 'accept search whitespace',
                    payload: {
                        search: '  '
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
            })
        }
    });

    void it('rejects search length > 100', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'rejects search length > 100',
                    payload: {
                        search: 'a'.repeat(101)
                    }
                },
                {
                    title: 'rejects search length > 100',
                    payload: {
                        search: 'a'.repeat(999)
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects non-string search', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonStringValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid search ${test.label}`,
                    payload: {
                        search: test.value
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('accept date object/date ISO string', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'data object',
                    payload: {
                        startDate: new Date(),
                        endDate: new Date()
                    }
                },
                {
                    title: 'date ISO string',
                    payload: {
                        startDate: new Date().toISOString(),
                        endDate: new Date().toISOString()
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
            })
        }
    });

    void it('rejects non-date value', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonDateValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid startDate ${test.label}`,
                    payload: {
                        startDate: test.value
                    }
                })),
                ...invalidNonDateValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid endDate ${test.label}`,
                    payload: {
                        endDate: test.value
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects when startDate > endDate', async () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListMemberByWorkspaceQuery = {
            startDate: today,
            endDate: yesterday
        };

        const result = listMemberByWorkspaceQuerySchema.safeParse(payload);
        assert.equal(result.success, false);
        const issue = result.error!.issues[0];
        assert.equal(issue.code, 'custom');
        assert.equal(issue.path[0], 'startDate');
        assert.equal(issue.message, 'Start date must be before end date');
    });

    void it('accept every workspace role value', async (t) => {
        const cases: Array<{
            title: string;
            payload: ListMemberByWorkspaceQuery;
        }> = [
                ...Object.values(WorkspaceRole).map((role) => ({
                    title: `accept workspace role ${role}`,
                    payload: {
                        role
                    }
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
            })
        }
    });

    void it('rejects invalid workspace role', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonStringValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid role ${test.label}`,
                    payload: {
                        role: test.value
                    }
                })),
                ...Object.values(WorkspaceRole).map((role) => ({
                    title: `rejects invalid role ${role} uppercase`,
                    payload: {
                        role: role.toUpperCase()
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedFields: string[];
        }> = [
                {
                    title: 'reject unknown field',
                    payload: {
                        foo: 'bar'
                    },
                    unrecognizedFields: ['foo']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        foo: 'bar',
                        bar: 'baz'
                    },
                    unrecognizedFields: ['foo', 'bar']
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);

                const issues = result.error!.issues[0];
                assert.ok(!result.success);

                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
            });
        }
    });

    void it('rejects when every fields invalid', async () => {
        const invalidPayload: unknown = {
            page: 'invalid',
            limit: 'invalid',
            search: 'invalid',
            startDate: 'invalid',
            endDate: 'invalid',
            role: 'invalid'
        }

        const result = listMemberByWorkspaceQuerySchema.safeParse(invalidPayload);
        assert.equal(result.success, false);
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
                const result = listMemberByWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            })
        }
    });
});