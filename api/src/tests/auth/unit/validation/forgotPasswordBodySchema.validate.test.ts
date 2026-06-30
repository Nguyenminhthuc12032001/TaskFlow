import { describe, it } from "node:test";
import { forgotPasswordBodySchema, type ForgotPasswordBody } from "../../../../modules/auth/auth.schemas.js";
import { createSingleInvalidFieldCases, uniqueEmail, type InvalidCasesByField } from "../../../helper.js";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: ForgotPasswordBody = {
    email: `${uniqueEmail()}`
}

void describe('forgotPasswordBodySchema', () => {
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
                title: 'accept valid payload with leading/trailing whitespace',
                payload: {
                    email: `   ${validPayload.email}   `
                }
            },
            {
                title: 'accept email uppercase',
                payload: {
                    email: validPayload.email.toUpperCase()
                }
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = forgotPasswordBodySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                assert.equal(result.data.email, validPayload.email);
            })
        }
    });

    void it('missing required field', async () => {
        const result = forgotPasswordBodySchema.safeParse({});

        assert.equal(result.success, false);
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<ForgotPasswordBody> = {
            email: invalidNonStringValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = forgotPasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
                const code = result.error!.issues[0].code;
                const path = result.error!.issues[0].path[0];
                assert.ok(code === 'invalid_type' || code === 'invalid_format' || code === 'invalid_value');
                assert.deepStrictEqual(path, testCase.invalidField);
            })
        }
    });

    void it('rejetcs invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
            title: `rejects invalid payload type ${test.label}`,
            payload: test.value
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = forgotPasswordBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
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
                    email: validPayload.email,
                    unknown: 'unknown'
                },
                unrecognizedFields: ['unknown']
            },
            {
                title: 'multiple unknown fields are not allowed',
                payload: {
                    email: validPayload.email,
                    unknown1: 'unknown1',
                    unknown2: 'unknown2'
                },
                unrecognizedFields: ['unknown1', 'unknown2']
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = forgotPasswordBodySchema.safeParse(testCase.payload);
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
