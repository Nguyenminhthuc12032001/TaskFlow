import { describe, it } from "node:test";
import { listWorkspaceQuerySchema, type ListWorkspaceQuery } from "../../../../modules/workspace/workspace.schemas.js";
import assert from "node:assert";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonStringValues } from "../../../validationTestValues.js";

void describe('listWorkspaceQuerySchema', () => {
    void it('accept valid query', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListWorkspaceQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        }

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept valid query',
                    payload
                },
                {
                    title: 'accept empty query',
                    payload: {}
                },
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, true);
                assert.deepStrictEqual(result.data, testCase.payload);
            });
        }
    });

    void it('accept type of page and limit are string', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const validPayload: ListWorkspaceQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept type of page is string',
                    payload: {
                        ...validPayload,
                        page: '1'
                    }
                },
                {
                    title: 'accept type of limit is string',
                    payload: {
                        ...validPayload,
                        limit: '10'
                    }
                },
                {
                    title: 'accept limit is undefined',
                    payload: {
                        ...validPayload,
                        limit: undefined
                    }
                },
                {
                    title: 'accept page is undefined',
                    payload: {
                        ...validPayload,
                        page: undefined
                    }
                },
                {
                    title: 'accept limit and page are undefined',
                    payload: {
                        ...validPayload,
                        limit: undefined,
                        page: undefined
                    }
                },
                {
                    title: 'accept valid range limit',
                    payload: {
                        ...validPayload,
                        limit: 100
                    }
                },
                {
                    title: 'accept valid range page',
                    payload: {
                        ...validPayload,
                        page: 100
                    }
                },
                {
                    title: 'accept valid range limit and page',
                    payload: {
                        ...validPayload,
                        limit: 100,
                        page: 100
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
            });
        }
    })

    void it('rejects invalid page', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListWorkspaceQuery = {
            page: 0,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };


        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonNumberValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid page ${test.label}`,
                    payload: {
                        ...payload,
                        page: test.value
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects invalid limit', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListWorkspaceQuery = {
            page: 1,
            limit: 0,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonNumberValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid limit ${test.label}`,
                    payload: {
                        ...payload,
                        limit: test.value
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('accept valid search', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListWorkspaceQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept valid search',
                    payload: {
                        ...payload,
                        search: 'test'
                    }
                },
                {
                    title: 'accept empty search',
                    payload: {
                        ...payload,
                        search: ''
                    }
                },
                {
                    title: 'accept undefined search',
                    payload: {
                        ...payload,
                        search: undefined
                    }
                },
                {
                    title: 'accept whitespace search',
                    payload: {
                        ...payload,
                        search: '  '
                    }
                },
                {
                    title: 'accept search with leading and trailing spaces',
                    payload: {
                        ...payload,
                        search: '  test  '
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
            });
        }
    });

    void it('rejects invalid search', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListWorkspaceQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonStringValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid search ${test.label}`,
                    payload: {
                        ...payload,
                        search: test.value
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('accept valid date range', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListWorkspaceQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept valid date range',
                    payload: {
                        ...payload,
                        startDate: yesterday,
                        endDate: today
                    }
                },
                {
                    title: 'accept undefined date range',
                    payload: {
                        ...payload,
                        startDate: undefined,
                        endDate: undefined
                    }
                },
                {
                    title: 'accept ISO string date range',
                    payload: {
                        ...payload,
                        startDate: yesterday.toISOString(),
                        endDate: today.toISOString()
                    }
                },  
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
            });
        }
    });

    void it('rejects invalid date value', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListWorkspaceQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonDateValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid date ${test.label}`,
                    payload: {
                        ...payload,
                        startDate: test.value
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listWorkspaceQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects when start date > end date', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListWorkspaceQuery = {
            page: 1,
            limit: 10,
            startDate: today,
            endDate: yesterday,
            search: 'test'
        };

        await t.test('rejects when start date > end date', async () => {
            const result = listWorkspaceQuerySchema.safeParse(payload);
            assert.equal(result.success, false);
        });
    });

    void it('rejects unknown fields', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const payload: ListWorkspaceQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };
        
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedKeys: Array<string>;
        }> = [
            {
                title: 'rejects unknown fields',
                payload: {
                    ...payload,
                    unknownField: 'test'
                },
                unrecognizedKeys: ['unknownField']
            },
            {
                title: 'rejects multiple unknown fields',
                payload: {
                    ...payload,
                    unknownField1: 'test',
                    unknownField2: 'test'
                },
                unrecognizedKeys: ['unknownField1', 'unknownField2']
            }, 
        ];
        
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listWorkspaceQuerySchema.safeParse(testCase.payload);

                const issues = result.error!.issues[0]; 

                assert.ok(!result.success);
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });
});