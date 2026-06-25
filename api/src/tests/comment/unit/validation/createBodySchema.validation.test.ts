import { describe, it } from "node:test";
import { createBodySchema, type CreateBodyType } from "../../../../modules/comment/comment.schemas.js";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: CreateBodyType = {
    content: 'test comment'
}

void describe('createBodySchema', () => {
    void it('accepts valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: CreateBodyType;
        }> = [
                {
                    title: 'valid normal payload',
                    payload: validPayload
                },
                {
                    title: 'valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        content: `  ${validPayload.content}  `
                    }
                },
                {
                    title: 'valid payload with exactly max length content',
                    payload: {
                        ...validPayload,
                        content: 'a'.repeat(100)
                    }
                },
                {
                    title: 'valid payload with exactly min length content',
                    payload: {
                        ...validPayload,
                        content: 'a'.repeat(5)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = createBodySchema.safeParse(testCase.payload)
                assert.ok(result.success);
                if (testCase.title === 'valid payload with leading/trailing whitespace') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
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
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<CreateBodyType> = {
            content: invalidNonStringValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: keyof CreateBodyType;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);

                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects misisng required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof CreateBodyType>;
        }> = createMissingRequiredFieldCases(createBodySchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, testCase.missingFields);
            })
        }
    });

    void it('rejects when content is longer than max length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
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
                const result = createBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);

                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'too_big');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects when content is shorter than min length', async (t) => {
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
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);

                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'too_small');
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
                        unknown: 'test'
                    },
                    unrecognizedFields: ['unknown']
                },
                {
                    title: 'rejects unknown fields',
                    payload: {
                        ...validPayload,
                        unknown: 'test',
                        unknown2: 'test2'
                    },
                    unrecognizedFields: ['unknown', 'unknown2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
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
});