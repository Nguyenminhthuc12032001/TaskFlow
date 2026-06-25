import { describe, it } from "node:test";
import { safeCommentSchema, type SafeCommentType } from "../../../../modules/comment/comment.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: SafeCommentType = {
    id: randomUUID(),
    taskId: randomUUID(),
    authorId: randomUUID(),
    content: 'test comment',
    createdAt: new Date(),
    updatedAt: new Date(),
    totalReplies: 0,
    parentId: randomUUID()
}

void describe('safeCommentSchema', () => {
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
                    title: 'accepts valid parentId undefined',
                    payload: {
                        ...validPayload,
                        parentId: undefined
                    }
                },
                {
                    title: 'accepts valid payload with ISO date string',
                    payload: {
                        ...validPayload,
                        createdAt: validPayload.createdAt.toISOString(),
                        updatedAt: validPayload.updatedAt.toISOString()
                    }
                },
                {
                    title: 'accepts valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        content: `  ${validPayload.content}  `
                    }
                },
                {
                    title: 'accepts valid payload with exactly max length content',
                    payload: {
                        ...validPayload,
                        content: 'a'.repeat(100)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = safeCommentSchema.safeParse(testCase.payload)
                assert.ok(result.success);
                if (testCase.title === 'accepts valid payload with leading/trailing whitespace') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
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
            payload: unknown;
            invalidField: keyof SafeCommentType
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeCommentType>
        }> = createMissingRequiredFieldCases(safeCommentSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, testCase.missingFields);
            })
        }
    });

    void it('rejects when greater/less than max/min length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                {
                    title: 'rejects when content length is less than min length',
                    payload: {
                        ...validPayload,
                        content: 'a'.repeat(4)
                    },
                    invalidField: 'content'
                },
                {
                    title: 'rejects when content length is greater than max length',
                    payload: {
                        ...validPayload,
                        content: 'a'.repeat(101)
                    },
                    invalidField: 'content'
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentSchema.safeParse(testCase.payload);
                assert.ok(!result.success);

                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'too_small' || issues.code === 'too_big');
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
                    title: 'rejects unknown field',
                    payload: {
                        ...validPayload,
                        unknownField: 'test'
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'rejects unknown field',
                    payload: {
                        ...validPayload,
                        unknownField: 'test',
                        unknownField2: 'test2'
                    },
                    unrecognizedFields: ['unknownField', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentSchema.safeParse(testCase.payload);
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
        }> = [
                ...invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
                    title: `rejects invalid payload type ${test.label}`,
                    payload: test.value
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeCommentSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});