import { describe, it } from "node:test";
import { listProjectsQuerySchema, type ListProjectsQueryType } from "../../../../modules/project/project.schemas.js";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: ListProjectsQueryType = {
    page: 1,
    limit: 10,
    startDate: new Date(),
    endDate: new Date(),
    search: 'test'
};

void describe('listProjectsQuerySchema', () => {
    void it('accept valid payload', async (t) => {

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'valid normal payload',
                    payload: validPayload
                },
                {
                    title: 'valid empty payload',
                    payload: {}
                },
                {
                    title: 'valid ISO string payload',
                    payload: {
                        ...validPayload,
                        startDate: validPayload.startDate!.toISOString(),
                        endDate: validPayload.endDate!.toISOString()
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);

                if (testCase.title === 'valid ISO string payload') {
                    assert.deepStrictEqual(result.data.startDate, validPayload.startDate);
                    assert.deepStrictEqual(result.data.endDate, validPayload.endDate);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('reject invalid fields', async (t) => {

        const invalidCasesByField: InvalidCasesByField<ListProjectsQueryType> = {
            startDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            endDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            page: invalidNonNumberValues.filter((test) => test.value !== undefined),
            limit: invalidNonNumberValues.filter((test) => test.value !== undefined),
            search: invalidNonStringValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsQuerySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const path = issues.path[0];
                assert.ok(code === 'invalid_type' || code === 'invalid_format' || code === 'invalid_value');
                assert.deepStrictEqual(path, testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof ListProjectsQueryType>;
        }> = createMissingRequiredFieldCases(listProjectsQuerySchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsQuerySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects when search length is greater than 100', async (t) => {
        const payload: ListProjectsQueryType = {
            ...validPayload,
            search: 'a'.repeat(101)
        };

        const result = listProjectsQuerySchema.safeParse(payload);
        assert.ok(!result.success);
        const issues = result.error!.issues[0];
        const code = issues.code;
        const path = issues.path[0];
        assert.ok(code === 'too_big');
        assert.deepStrictEqual(path, 'search');
    });

    void it('rejects when startDate > endDate', async (t) => {
        const payload: ListProjectsQueryType = {
            ...validPayload,
            startDate: new Date('2023-01-01'),
            endDate: new Date('2022-01-01')
        };

        const result = listProjectsQuerySchema.safeParse(payload);
        assert.ok(!result.success);
        const issues = result.error!.issues[0];
        const code = issues.code;
        const path = issues.path[0];
        assert.ok(code === 'custom');
        assert.deepStrictEqual(path, 'startDate');
    });

    void it('rejects when page/limit range is invalid', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                {
                    title: 'page < 1',
                    payload: {
                        ...validPayload,
                        page: 0
                    },
                    invalidField: 'page'
                },
                {
                    title: 'limit < 1',
                    payload: {
                        ...validPayload,
                        limit: 0
                    },
                    invalidField: 'limit'
                },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsQuerySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const path = issues.path[0];
                assert.ok(code === 'too_small' || code === 'too_big');
                assert.deepStrictEqual(path, testCase.invalidField);
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedFields: Array<string>;
        }> = [
                {
                    title: 'unknown field',
                    payload: {
                        ...validPayload,
                        unknownField: 'test'
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField1: 'test',
                        unknownField2: 'test'
                    },
                    unrecognizedFields: ['unknownField1', 'unknownField2']
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsQuerySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const path = issues.path;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(path, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
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
                const result = listProjectsQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});