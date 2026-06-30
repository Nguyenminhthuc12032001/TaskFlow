import { describe, it } from "node:test";
import { resetPasswordBodySchema, type ResetPasswordBody } from "../../../../modules/auth/auth.schemas.js";
import assert from "node:assert";
import { invalidNonStringValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: ResetPasswordBody = {
    resetToken: 'a'.repeat(10),
    newPassword: 'password123'
}

void describe('resetPasswordBodySchema', () => {
    void it('accepts valid payload', async (t) => {
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
                        resetToken: `   ${validPayload.resetToken}   `
                    }
                },
                {
                    title: 'accepts valid payload with exactly min length resetToken',
                    payload: {
                        ...validPayload,
                        resetToken: 'a'.repeat(10)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'accepts valid payload with min length resetToken') {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonStringValues.filter((test) => typeof test.value !== 'string').map((test) => ({
            title: `rejects invalid payload type ${test.label}`,
            payload: test.value
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<ResetPasswordBody> = {
            resetToken: invalidNonStringValues,
            newPassword: invalidNonStringValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path, [testCase.invalidField]);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[]
        }> = createMissingRequiredFieldCases(resetPasswordBodySchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const codes = result.error!.issues.map((issue) => issue.code);
                const paths = result.error!.issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type'), true);
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedFields: string[]
        }> = [
            {
                title: 'rejects unknown fields',
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
                    unknownField1: 'value1',
                    unknownField2: 'value2'
                },
                unrecognizedFields: ['unknownField1', 'unknownField2']
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);
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
});
