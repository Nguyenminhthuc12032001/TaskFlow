import { describe, it } from "node:test";
import { listCommentsQuerySchema, type ListCommentsQueryType } from "../../../../modules/comment/comment.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: ListCommentsQueryType = {
    startDate: new Date(),
    endDate: new Date(),
    parentId: randomUUID(),
    page: 1,
    limit: 10,
    search: 'test'
}

void describe('listCommentsQuerySchema', () => {
    void it('accept valid paylaod', async (t) => {
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
                },
                {
                    title: 'valid search with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        search: `  ${validPayload.search}  `
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listCommentsQuerySchema.safeParse(testCase.payload);
                assert.ok(result.success);

                if (testCase.title === 'valid search with leading/trailing whitespace' || testCase.title === 'valid ISO string payload') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<ListCommentsQueryType> = {
            startDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            endDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            parentId: invalidNonUUIDValues.filter((test) => test.value !== undefined),
            page: invalidNonNumberValues.filter((test) => test.value !== undefined),
            limit: invalidNonNumberValues.filter((test) => test.value !== undefined),
            search: invalidNonStringValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: keyof ListCommentsQueryType
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listCommentsQuerySchema.safeParse(testCase.payload);
                assert.ok(!result.success);

                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects when search is longer than max length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                {
                    title: 'rejects when search length is greater than max length',
                    payload: {
                        ...validPayload,
                        search: 'a'.repeat(101)
                    },
                    invalidField: 'search'
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listCommentsQuerySchema.safeParse(testCase.payload);
                assert.ok(!result.success);

                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'too_big');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
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
                    title: 'rejects unknown fields',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown'
                    },
                    unrecognizedFields: ['unknown']
                },
                {
                    title: 'rejects unknown fields',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown',
                        unknown2: 'unknown2'
                    },
                    unrecognizedFields: ['unknown', 'unknown2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listCommentsQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
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
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listCommentsQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});