import { describe, it } from "node:test";
import { updateBodySchema, type UpdateBodyType } from "../../../../modules/column/column.schemas.js";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: UpdateBodyType = {
    name: 'Test Column'
}

void describe('updateBodySchema', () => {
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
                    title: 'valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `
                    }
                },
                {
                    title: 'accept exact max length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept exact min length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(2)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
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

    void it('rejects invalid name length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'rejects name too short',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(1)
                    }
                },
                {
                    title: 'rejects name too long',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(101)
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'too_small' || result.error!.issues[0].code === 'too_big');
                assert.deepStrictEqual(result.error!.issues[0].path[0], 'name');
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<UpdateBodyType> = {
            name: invalidNonStringValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'invalid_type' || result.error!.issues[0].code === 'invalid_format' || result.error!.issues[0].code === 'invalid_value');
                assert.deepStrictEqual(result.error!.issues[0].path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof UpdateBodyType>;
        }> = createMissingRequiredFieldCases(updateBodySchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
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
                const result = updateBodySchema.safeParse(testCase.payload);
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
            unknownFields: Array<string>;
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown'
                    },
                    unknownFields: ['unknown']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown',
                        anotherUnknown: 'anotherUnknown'
                    },
                    unknownFields: ['unknown', 'anotherUnknown']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unknownFields);
                }
            })
        }
    });
});