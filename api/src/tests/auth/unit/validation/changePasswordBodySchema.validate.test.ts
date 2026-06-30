import { describe, it } from "node:test";
import { changePasswordBodySchema, type ChangePasswordBody } from "../../../../modules/auth/auth.schemas.js";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: ChangePasswordBody = {
    currentPassword: 'password123',
    newPassword: 'password123'
}

void describe('changePasswordBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: ChangePasswordBody;
        }> = [
                {
                    title: 'valid normail payload',
                    payload: validPayload
                },
                {
                    title: 'accept valid payload with leading/trailing whitespace',
                    payload: {
                        currentPassword: '   password123   ',
                        newPassword: '   password123   '
                    }
                },
                {
                    title: 'accept valid payload with maximum length of fields',
                    payload: {
                        currentPassword: 'a'.repeat(72),
                        newPassword: 'a'.repeat(72)
                    }
                },
                {
                    title: 'accept valid payload with minimum length of fields',
                    payload: {
                        currentPassword: 'a'.repeat(8),
                        newPassword: 'a'.repeat(8)
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = changePasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, true);
                assert.deepEqual(result.data, testCase.payload);
            })
        }
    });

    void it('rejects missing required field', async (t) => {
        const cases: Array<{
            title: string,
            payload: unknown;
            missingFields: string[]
        }> = createMissingRequiredFieldCases(changePasswordBodySchema, validPayload);
            
            for (const testCase of cases) {
                await t.test(testCase.title, () => {
                    const result = changePasswordBodySchema.safeParse(testCase.payload);

                    assert.equal(result.success, false);
                    const codes = result.error!.issues.map((issue) => issue.code);
                    const paths = result.error!.issues.map((issue) => issue.path[0]);
                    assert.deepStrictEqual(codes.every((code) => code === 'invalid_type'), true);
                    assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
                })
            }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<ChangePasswordBody> = {
            currentPassword: invalidNonStringValues,
            newPassword: invalidNonStringValues
        }

        const cases: Array<{
          title: string;
          payload: unknown;
          invalidField: string
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

            for (const testCase of cases) {
                await t.test(testCase.title, () => {
                    const result = changePasswordBodySchema.safeParse(testCase.payload);

                    assert.equal(result.success, false);
                    const code = result.error!.issues[0].code;
                    const path = result.error!.issues[0].path[0];
                    assert.ok(code === 'invalid_type' || code === 'invalid_format' || code === 'invalid_value');
                    assert.deepStrictEqual(path, testCase.invalidField);
                })
            }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
          title: string;
          payload: unknown;
          unrecognizedFields: Array<string>
        }> = [
                {
                    title: 'unknown fields are not allowed',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 'password123',
                        unknown: 'unknown'
                    },
                    unrecognizedFields: ['unknown']
                },
                {
                    title: 'multiple unknown fields are not allowed',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 'password123',
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    },
                    unrecognizedFields: ['unknown1', 'unknown2']
                }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = changePasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const code = issues[0].code;
                const path = issues[0].path;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(path, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues[0].keys, testCase.unrecognizedFields);
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
                const result = changePasswordBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false); 
                assert.equal(result.error!.issues[0].code, 'invalid_type');
            })
        }
    });
});
