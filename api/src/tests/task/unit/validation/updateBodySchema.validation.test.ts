import { describe, it } from "node:test";
import { TaskPriority } from "../../../../../prisma/generated/enums.js";
import { updateBodySchema, type UpdateBodyType } from "../../../../modules/task/task.schemas.js";
import assert from "node:assert";
import { invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";
import { createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: UpdateBodyType = {
    title: 'Updated Task',
    description: 'This is a updated task',
    dueDate: new Date(),
    priority: TaskPriority.low,
}

void describe('updateBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept valid payload',
                    payload: validPayload
                },
                {
                    title: 'accept ISO date string',
                    payload: {
                        ...validPayload,
                        dueDate: validPayload.dueDate!.toISOString()
                    }
                },
                {
                    title: 'accept leading/trailing whitespace search',
                    payload: {
                        ...validPayload,
                        title: ` ${validPayload.title} `,
                        description: ` ${validPayload.description} `
                    }
                },
                ...Object.values(TaskPriority).map(priority => ({
                    title: `accept priority ${priority}`,
                    payload: {
                        ...validPayload,
                        priority
                    }
                })),
                {
                    title: 'accept missing fields except title',
                    payload: {
                        ...validPayload,
                        description: undefined,
                        dueDate: undefined,
                        priority: undefined
                    }
                },
                {
                    title: 'accept maximum length fields',
                    payload: {
                        ...validPayload,
                        title: 'a'.repeat(100),
                        description: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept minimum length fields',
                    payload: {
                        ...validPayload,
                        title: 'a'.repeat(5),
                        description: 'a'.repeat(10)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await updateBodySchema.safeParseAsync(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'accept ISO date string' || testCase.title === 'accept leading/trailing whitespace search') {
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
        }> = invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
            title: `rejects invalid payload type ${test.label}`,
            payload: test.value
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await updateBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<UpdateBodyType> = {
            title: invalidNonStringValues.filter((test) => test.value !== undefined),
            description: invalidNonStringValues.filter((test) => test.value !== undefined),
            dueDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            priority: invalidNonStringValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await updateBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path, [testCase.invalidField]);
            })
        }
    });

    void it('rejects greater than max length of fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                {
                    title: 'rejects title greater than max length',
                    payload: {
                        ...validPayload,
                        title: 'a'.repeat(101)
                    },
                    invalidField: 'title'
                },
                {
                    title: 'rejects description greater than max length',
                    payload: {
                        ...validPayload,
                        description: 'a'.repeat(101)
                    },
                    invalidField: 'description'
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await updateBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'too_big');
                assert.deepStrictEqual(issues.path, [testCase.invalidField]);
            })
        }
    });

    void it('rejects less than min length of fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                {
                    title: 'rejects title less than min length',
                    payload: {
                        ...validPayload,
                        title: 'a'.repeat(4)
                    },
                    invalidField: 'title'
                },
                {
                    title: 'rejects description less than min length',
                    payload: {
                        ...validPayload,
                        description: 'a'.repeat(9)
                    },
                    invalidField: 'description'
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await updateBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'too_small');
                assert.deepStrictEqual(issues.path, [testCase.invalidField]);
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedFields: string[];
        }> = [
                {
                    title: 'rejects unknown field',
                    payload: {
                        ...validPayload,
                        unknownField: 'value'
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField1: 'value',
                        unknownField2: 'value'
                    },
                    unrecognizedFields: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await updateBodySchema.safeParseAsync(testCase.payload);
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