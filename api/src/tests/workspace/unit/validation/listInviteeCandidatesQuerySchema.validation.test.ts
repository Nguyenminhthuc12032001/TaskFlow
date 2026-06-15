import { describe, it } from "node:test";
import { listInviteeCandidatesQuerySchema, type ListInviteeCandidatesQuery } from "../../../../modules/workspace/workspace.schemas.js";
import assert from "node:assert";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

void describe('listInviteeCandidatesQuerySchema', () => {
    void it('accept valid payload', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const validPayload: ListInviteeCandidatesQuery = {
            search: 'test',
            startDate: yesterday,
            endDate: today,
            page: 1,
            limit: 10
        }

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept empty payload',
                    payload: {}
                },
                {
                    title: 'accept full payload',
                    payload: validPayload
                },
                {
                    title: 'accept ISO string payload',
                    payload: {
                        search: 'test',
                        startDate: yesterday.toISOString(),
                        endDate: today.toISOString(),
                        page: 1,
                        limit: 10
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title !== 'accept empty payload') {
                    if (testCase.title === 'accept ISO string payload') {
                        assert.deepStrictEqual(result.data, validPayload);
                    }
                    else {
                        assert.deepStrictEqual(result.data, testCase.payload);
                    }
                }
            })
        }
    });

    void it('accept valid page/limit', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const validPayload: ListInviteeCandidatesQuery = {
            search: 'test',
            startDate: yesterday,
            endDate: today,
            page: 1,
            limit: 10
        }

        const cases: Array<{
            title: string;
            payload: unknown
        }> = [
                {
                    title: 'accept string page',
                    payload: {
                        ...validPayload,
                        page: '1'
                    }
                },
                {
                    title: 'accept number page',
                    payload: {
                        ...validPayload,
                        page: 1
                    }
                },
                {
                    title: 'accept undefined page',
                    payload: {
                        ...validPayload,
                        page: undefined
                    }
                },
                {
                    title: 'accept string limit',
                    payload: {
                        ...validPayload,
                        limit: '10'
                    }
                },
                {
                    title: 'accept number limit',
                    payload: {
                        ...validPayload,
                        limit: 10
                    }
                },
                {
                    title: 'accept undefined limit',
                    payload: {
                        ...validPayload,
                        limit: undefined
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
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
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                if (testCase.title.includes('page')) {
                    assert.equal(issues.path[0], 'page');
                } else {
                    assert.equal(issues.path[0], 'limit');
                }
            });
        }
    });

    void it('accept valid search', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const validPayload: ListInviteeCandidatesQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        const cases: Array<{
            title: string;
            payload: ListInviteeCandidatesQuery;
        }> = [
                {
                    title: 'accept valid normal search',
                    payload: validPayload
                },
                {
                    title: 'accept leading/trailing whitespace search',
                    payload: {
                        ...validPayload,
                        search: '  test  '
                    }
                },
                {
                    title: 'accept empty search',
                    payload: {
                        ...validPayload,
                        search: ''
                    }
                },
                {
                    title: 'accept whitespace search',
                    payload: {
                        ...validPayload,
                        search: '  '
                    }
                },
                {
                    title: 'accept undefined search',
                    payload: {
                        ...validPayload,
                        search: undefined
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                testCase.payload.search = testCase.payload.search?.trim();
                if (testCase.payload.search === '') {
                    testCase.payload.search = undefined;
                }
                assert.deepStrictEqual(result.data, testCase.payload);
            })
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
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.equal(issues.path[0], 'search');
            });
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
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'too_big');
                assert.equal(issues.path[0], 'search');
            });
        }
    });

    void it('accept valid date object', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const validPayload: ListInviteeCandidatesQuery = {
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
                    title: 'accept valid normal date',
                    payload: validPayload
                },
                {
                    title: 'accept undefined start date',
                    payload: {
                        ...validPayload,
                        startDate: undefined
                    }
                },
                {
                    title: 'accept undefined end date',
                    payload: {
                        ...validPayload,
                        endDate: undefined
                    }
                },
                {
                    title: 'accept undefined start date and end date',
                    payload: {
                        ...validPayload,
                        startDate: undefined,
                        endDate: undefined
                    }
                },
                {
                    title: 'accept ISO string startDate',
                    payload: {
                        ...validPayload,
                        startDate: yesterday.toISOString()
                    }
                },
                {
                    title: 'accept ISO string endDate',
                    payload: {
                        ...validPayload,
                        endDate: today.toISOString()
                    }
                },
                {
                    title: 'accept ISO string startDate and endDate',
                    payload: {
                        ...validPayload,
                        startDate: yesterday.toISOString(),
                        endDate: today.toISOString()
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title.includes('ISO string')) {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects non-date value', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const validPayload: ListInviteeCandidatesQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidFields: string[];
        }> = [
                ...invalidNonDateValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid startDate ${test.label}`,
                    payload: {
                        ...validPayload,
                        startDate: test.value
                    },
                    invalidFields: ['startDate']
                })),
                ...invalidNonDateValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid endDate ${test.label}`,
                    payload: {
                        ...validPayload,
                        endDate: test.value
                    },
                    invalidFields: ['endDate']
                })),
                ...invalidNonDateValues.filter((test) => test.value !== undefined).map((test) => ({
                    title: `rejects invalid startDate and endDate ${test.label}`,
                    payload: {
                        ...validPayload,
                        startDate: test.value,
                        endDate: test.value
                    },
                    invalidFields: ['startDate', 'endDate']
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const paths = result.error!.issues.map((issue) => issue.path[0]);
                const codes = result.error!.issues.map((issue) => issue.code);
                assert.deepStrictEqual(paths, testCase.invalidFields);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type'), true);
            });
        }
    });

    void it('rejects when startDate > endDate', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const validPayload: ListInviteeCandidatesQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        await t.test('rejects when startDate > endDate', async () => {
            const result = listInviteeCandidatesQuerySchema.safeParse({
                ...validPayload,
                startDate: today,
                endDate: yesterday
            });
            assert.equal(result.success, false);
            const issues = result.error!.issues[0];
            assert.equal(issues.code, 'custom');
            assert.equal(issues.path[0], 'startDate');
            assert.equal(issues.message, 'Start date must be before end date');
        });
    });

    void it('rejects unknown fields', async (t) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const validPayload: ListInviteeCandidatesQuery = {
            page: 1,
            limit: 10,
            startDate: yesterday,
            endDate: today,
            search: 'test'
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedFields: string[];
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField: 'test'
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField1: 'test',
                        unknownField2: 'test'
                    },
                    unrecognizedFields: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.equal(issue.code, 'unrecognized_keys');
                assert.deepStrictEqual(issue.path, []);
                if (issue.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issue.keys, testCase.unrecognizedFields);
                }
            });
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
                const result = listInviteeCandidatesQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    }); 
});
