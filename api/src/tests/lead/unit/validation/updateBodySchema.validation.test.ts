import { describe, it } from "node:test";
import { updateBodySchema, type UpdateBodyType } from "../../../../modules/lead/lead.schemas.js";
import { createSingleInvalidFieldCases, uniqueEmail, uniquePhoneNumber, type InvalidCasesByField } from "../../../helper.js";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: UpdateBodyType = {
    name: 'Test Lead',
    email: uniqueEmail(),
    phone: uniquePhoneNumber(),
    source: 'Test Source',
    note: 'Test Note'
}

void describe('updateBodySchema', () => {
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
                    title: 'accepts valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `,
                        email: `  ${validPayload.email}  `,
                        phone: `  ${validPayload.phone}  `,
                        source: `  ${validPayload.source}  `,
                        note: `  ${validPayload.note}  `
                    }
                },
                {
                    title: 'accepts empty payload',
                    payload: {}
                },
                {
                    title: 'accepts exactly maximum content length payload',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100),
                        source: 'a'.repeat(100),
                        note: 'a'.repeat(200)
                    }
                },
                {
                    title: 'accepts exactly minimum content length payload',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(5),
                        source: 'a'.repeat(10),
                        note: 'a'.repeat(5)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, true);

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
        const invalidCasesByField: InvalidCasesByField<UpdateBodyType> = {
            name: invalidNonStringValues.filter((test) => test.value !== undefined),
            email: invalidNonStringValues.filter((test) => test.value !== undefined),
            phone: invalidNonStringValues.filter((test) => test.value !== undefined),
            source: invalidNonStringValues.filter((test) => test.value !== undefined),
            note: invalidNonStringValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: keyof UpdateBodyType
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects greater than maximum fields length', async () => {
        const invalidPayload: UpdateBodyType = {
            ...validPayload,
            name: 'a'.repeat(101),
            source: 'a'.repeat(101),
            note: 'a'.repeat(201)
        }

        const result = updateBodySchema.safeParse(invalidPayload);
        assert.equal(result.success, false);
        const issues = result.error!.issues;
        const codes = issues.map((issue) => issue.code);
        assert.ok(codes.every((code) => code === 'too_big'));
    });

    void it('rejects less than minimum fields length', async () => {
        const invalidPayload: UpdateBodyType = {
            ...validPayload,
            name: 'a'.repeat(4),
            source: 'a'.repeat(9),
            note: 'a'.repeat(4)
        }

        const result = updateBodySchema.safeParse(invalidPayload);
        assert.equal(result.success, false);
        const issues = result.error!.issues;
        const codes = issues.map((issue) => issue.code);
        assert.ok(codes.every((code) => code === 'too_small'));
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unknownFields: Array<string>;
        }> = [
                {
                    title: 'rejects unknown field',
                    payload: {
                        ...validPayload,
                        unknownField: 'unknown'
                    },
                    unknownFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField1: 'unknown',
                        unknownField2: 'unknown'
                    },
                    unknownFields: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unknownFields);
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
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});