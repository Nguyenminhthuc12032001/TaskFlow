import { describe, it } from "node:test";
import { listColumnQuerySchema, type ListColumnQueryType } from "../../../../modules/column/column.schemas.js";
import { ColumnType } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validQuery: ListColumnQueryType = {
    page: 1,
    limit: 10,
    type: ColumnType.todo,
    startDate: new Date(),
    endDate: new Date(),
    search: 'test'
}

void describe('listColumnQuerySchema', () => {
    void it('accept valid query', async (t) => {
        const cases: Array<{
            title: string;
            payload: {
                page?: number;
                limit?: number;
                type?: ColumnType;
                startDate?: Date | string;
                endDate?: Date | string;
                search?: string;
            };
        }> = [
                {
                    title: 'normal query',
                    payload: validQuery
                },
                {
                    title: 'empty query',
                    payload: {}
                },
                {
                    title: 'ISO date string',
                    payload: {
                        ...validQuery,
                        startDate: validQuery.startDate!.toISOString(),
                        endDate: validQuery.endDate!.toISOString()
                    }
                },
                ...Object.values(ColumnType).map((type) => ({
                    title: `valid type ${type}`,
                    payload: {
                        ...validQuery,
                        type
                    }
                })),
                {
                    title: 'valid search with leading/trailing whitespace',
                    payload: {
                        ...validQuery,
                        search: `  ${validQuery.search}  `
                    }
                },
                {
                    title: 'valid page and limit',
                    payload: {
                        ...validQuery,
                        page: 2,
                        limit: 10
                    }
                },
                {
                    title: 'accept valid search length',
                    payload: {
                        ...validQuery,
                        search: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept valid search length with leading/trailing whitespace',
                    payload: {
                        ...validQuery,
                        search: `  ${'a'.repeat(100)}  `
                    }
                },
                {
                    title: 'accept valid date range',
                    payload: {
                        ...validQuery,
                        startDate: new Date('2022-01-01'),
                        endDate: new Date('2022-12-31')
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listColumnQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, true);

                if (testCase.payload.search && testCase.payload.search?.trim() !== '') {
                    testCase.payload.search = testCase.payload.search?.trim();
                }

                if (testCase.title === 'valid search with leading/trailing whitespace' || testCase.title === 'ISO date string') {
                    assert.deepStrictEqual(result.data, validQuery);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid query fields', async (t) => {

        const invalidCasesByField: InvalidCasesByField<ListColumnQueryType> = {
            startDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            endDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            type: invalidNonStringValues.filter((test) => test.value !== undefined),
            page: invalidNonNumberValues.filter((test) => test.value !== undefined),
            limit: invalidNonNumberValues.filter((test) => test.value !== undefined),
            search: invalidNonStringValues.filter((test) => test.value !== undefined)
        }
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = createSingleInvalidFieldCases(validQuery, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listColumnQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
            title: test.label,
            payload: test.value
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listColumnQuerySchema.safeParse(testCase.payload);
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
                        name: 'Test Workspace',
                        unknown: 'unknown'
                    },
                    unrecognizedKeys: ['name', 'unknown']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        name: 'Test Workspace',
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    },
                    unrecognizedKeys: ['name', 'unknown1', 'unknown2']
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listColumnQuerySchema.safeParse(testCase.payload);
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