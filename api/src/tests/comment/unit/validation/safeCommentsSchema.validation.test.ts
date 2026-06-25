import { describe, it } from "node:test";
import { safeCommentsSchema, type SafeCommentsType, type SafeCommentType } from "../../../../modules/comment/comment.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonArrayValues, invalidNonBooleanValues, invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: SafeCommentsType = {
    data: [
        {
            id: randomUUID(),
            taskId: randomUUID(),
            authorId: randomUUID(),
            content: 'test comment',
            createdAt: new Date(),
            updatedAt: new Date(),
            totalReplies: 0,
            parentId: randomUUID()
        },
        {
            id: randomUUID(),
            taskId: randomUUID(),
            authorId: randomUUID(),
            content: 'test comment',
            createdAt: new Date(),
            updatedAt: new Date(),
            totalReplies: 0,
            parentId: randomUUID()
        }
    ],
    paginationMeta: {
        page: 1,
        limit: 10,
        totalItems: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    }
}

void describe('safeCommentsSchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accepts valid payload',
                    payload: validPayload
                },
                {
                    title: 'accepts valid payload with ISO date string',
                    payload: {
                        ...validPayload,
                        data: [
                            {
                                ...validPayload.data[0],
                                createdAt: validPayload.data[0].createdAt.toISOString(),
                                updatedAt: validPayload.data[0].updatedAt.toISOString()
                            },
                            {
                                ...validPayload.data[1],
                                createdAt: validPayload.data[1].createdAt.toISOString(),
                                updatedAt: validPayload.data[1].updatedAt.toISOString()
                            }
                        ]
                    }
                },
                {
                    title: 'accepts valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        data: [
                            {
                                ...validPayload.data[0],
                                content: `  ${validPayload.data[0].content}  `
                            },
                            {
                                ...validPayload.data[1],
                                content: `  ${validPayload.data[1].content}  `
                            }
                        ]
                    }
                },
                {
                    title: 'accepts valid payload with exactly max length content',
                    payload: {
                        ...validPayload,
                        data: [
                            {
                                ...validPayload.data[0],
                                content: 'a'.repeat(100)
                            },
                            {
                                ...validPayload.data[1],
                                content: 'a'.repeat(100)
                            }
                        ]
                    }
                },
                {
                    title: 'accepts valid payload with exactly min length content',
                    payload: {
                        ...validPayload,
                        data: [
                            {
                                ...validPayload.data[0],
                                content: 'a'.repeat(5)
                            },
                            {
                                ...validPayload.data[1],
                                content: 'a'.repeat(5)
                            }
                        ]
                    }
                },
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = safeCommentsSchema.safeParse(testCase.payload)
                assert.ok(result.success);
                if (testCase.title === 'accepts valid payload with leading/trailing whitespace' || testCase.title === 'accepts valid payload with ISO date string') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeCommentsType> = {
            data: invalidNonArrayValues,
            paginationMeta: invalidNonObjectValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentsSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid data fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeCommentType> = {
            id: invalidNonUUIDValues,
            taskId: invalidNonUUIDValues,
            authorId: invalidNonUUIDValues,
            content: invalidNonStringValues,
            createdAt: invalidNonDateValues,
            updatedAt: invalidNonDateValues,
            totalReplies: invalidNonNumberValues,
            parentId: invalidNonUUIDValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: {
                data: Array<unknown>;
                paginationMeta: SafeCommentsType['paginationMeta'];
            };
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.data[0], invalidCasesByField).map((testCase) => ({
            title: `rejects data: ${testCase.invalidField}`,
            payload: {
                data: [testCase.payload],
                paginationMeta: validPayload.paginationMeta
            },
            invalidField: testCase.invalidField
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentsSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_format' || issue.code === 'invalid_value');
                assert.deepStrictEqual(issue.path[2], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid paginationMeta fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeCommentsType['paginationMeta']> = {
            page: invalidNonNumberValues,
            limit: invalidNonNumberValues,
            totalItems: invalidNonNumberValues,
            totalPages: invalidNonNumberValues,
            hasNextPage: invalidNonBooleanValues,
            hasPrevPage: invalidNonBooleanValues
        }

        const cases: Array<{
            title: string;
            payload: {
                data: SafeCommentsType['data'];
                paginationMeta: unknown;
            };
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.paginationMeta, invalidCasesByField).map((testCase) => {
            return {
                title: `rejects paginationMeta: ${testCase.invalidField}`,
                payload: {
                    data: validPayload.data,
                    paginationMeta: testCase.payload
                },
                invalidField: testCase.invalidField
            }
        });

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentsSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_value' || issue.code === 'invalid_format');
                assert.ok(issue.path[1] === testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeCommentsType>
        }> = createMissingRequiredFieldCases(safeCommentsSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                const missingPaths = result.error!.issues.map((issue) => issue.path[0]);
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(missingPaths, testCase.missingFields);
            })
        }
    });

    void it('rejects duplicate ids', async () => {
        const duplicateIdPayload = {
            data: [
                validPayload.data[0],
                validPayload.data[0]
            ],
            paginationMeta: validPayload.paginationMeta
        }

        const result = safeCommentsSchema.safeParse(duplicateIdPayload);
        assert.equal(result.success, false);
        const issues = result.error!.issues[0];
        assert.equal(issues.code, 'custom');
        assert.deepStrictEqual(issues.path, ['data', 1, 'id']);
    });

    void it('rejects data unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: {
                data: Array<unknown>;
                paginationMeta: SafeCommentsType['paginationMeta'];
            };
            unrecognizedFields: Array<string>;
        }> = [
                {
                    title: 'rejects data unknown fields',
                    payload: {
                        data: [{ ...validPayload.data[0], unknown: 'test' }],
                        paginationMeta: validPayload.paginationMeta
                    },
                    unrecognizedFields: ['unknown']
                },
                {
                    title: 'rejects data unknown fields',
                    payload: {
                        data: [{ ...validPayload.data[0], unknown: 'test', unknown2: 'test2' }],
                        paginationMeta: validPayload.paginationMeta
                    },
                    unrecognizedFields: ['unknown', 'unknown2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, ['data', 0]);
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
        }> = [
                ...invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
                    title: `rejects invalid payload type ${test.label}`,
                    payload: test.value
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});