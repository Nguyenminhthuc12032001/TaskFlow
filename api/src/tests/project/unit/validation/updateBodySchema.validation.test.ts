import { describe, it } from "node:test";
import { updateBodySchema, type UpdateBodyType } from "../../../../modules/project/project.schemas.js";
import assert from "node:assert";
import { createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: UpdateBodyType = {
    name: 'Test Project',
    description: 'This is a test project'
}

void describe('updateBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept normal valid payload',
                    payload: validPayload
                },
                {
                    title: 'accept valid name with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `
                    }
                },
                {
                    title: 'accept valid description with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        description: `  ${validPayload.description}  `
                    }
                },
                {
                    title: 'accept valid name with exactly max length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept valid description with exactly max length',
                    payload: {
                        ...validPayload,
                        description: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept valid name with exactly min length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(2)
                    }
                },
                {
                    title: 'accept valid description with exactly min length',
                    payload: {
                        ...validPayload,
                        description: 'a'.repeat(10)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'accept valid name with leading/trailing whitespace' || testCase.title === 'accept valid description with leading/trailing whitespace') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<UpdateBodyType> = {
            name: invalidNonStringValues.filter((test) => test.value !== undefined),
            description: invalidNonStringValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
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
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects when name/description length exceeds max length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                {
                    title: 'rejects when name length exceeds max length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(101)
                    },
                    invalidField: 'name'
                },
                {
                    title: 'rejects when description length exceeds max length',
                    payload: {
                        ...validPayload,
                        description: 'a'.repeat(101)
                    },
                    invalidField: 'description'
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'too_big');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects when name/description length is less than min length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                {
                    title: 'rejects when name length is less than min length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(1)
                    },
                    invalidField: 'name'
                },
                {
                    title: 'rejects when description length is less than min length',
                    payload: {
                        ...validPayload,
                        description: 'a'.repeat(9)
                    },
                    invalidField: 'description'
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'too_small');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
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
                        unknownField: 'a'
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField1: 'a',
                        unknownField2: 'a'
                    },
                    unrecognizedFields: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const paths = issues.path;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(paths, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
            })
        }
    });
});