import { describe, it } from "node:test";
import { createBodySchema, type CreateBodyType } from "../../../../modules/project/project.schemas.js";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: CreateBodyType = {
    name: 'Test Project',
    description: 'This is a test project'
}

void describe('createBodySchema', () => {
    void it('accept valid payload', async () => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept normal valid payload',
                    payload: validPayload
                },
                {
                    title: 'accept valid name with exactly max length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100)
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
                    title: 'accept valid name with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `
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
                    title: 'accept valid description with exactly min length',
                    payload: {
                        ...validPayload,
                        description: 'a'.repeat(10)
                    }
                },
                {
                    title: 'accept valid description with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        description: `  ${validPayload.description}  `
                    }
                }
            ]

        for (const testCase of cases) {
            const result = createBodySchema.safeParse(testCase.payload);
            assert.ok(result.success);
            if (testCase.title === 'accept valid name with leading/trailing whitespace' || testCase.title === 'accept valid description with leading/trailing whitespace') {
                assert.deepStrictEqual(result.data, validPayload);
            }
            else {
                assert.deepStrictEqual(result.data, testCase.payload);
            }
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<CreateBodyType> = {
            name: invalidNonStringValues,
            description: invalidNonStringValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
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
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
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
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects when text length exceeds max length', async (t) => {
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
                const result = createBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'too_big');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects when text length is less than min length', async (t) => {
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
                        description: 'a'.repeat(1)
                    },
                    invalidField: 'description'
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
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
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'rejects unknown field',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown'
                    },
                    unrecognizedKeys: ['unknown']
                },
                {
                    title: 'rejects multiple fields',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown',
                        anotherUnknown: 'anotherUnknown'
                    },
                    unrecognizedKeys: ['unknown', 'anotherUnknown']
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const path = issues.path;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(path, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });
});