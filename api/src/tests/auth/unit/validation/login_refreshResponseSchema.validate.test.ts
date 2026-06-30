import { describe, it } from "node:test";
import { loginResponseSchema, type LoginResponse } from "../../../../modules/auth/auth.schemas.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, type InvalidCasesByField } from "../../../helper.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: LoginResponse = {
    user: {
        id: `${randomUUID()}`,
        name: 'Test User',
        email: `${uniqueEmail()}`,
    },
    accessToken: 'accessToken'
}

void describe('login_refreshResponseSchema', () => {
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
                        user: {
                            ...validPayload.user,
                            name: ` ${validPayload.user.name} `,
                            email: `   ${validPayload.user.email}   `,
                        },
                        accessToken: `  ${validPayload.accessToken}  `
                    }
                },
                {
                    title: 'accept valid payload with exactly min length accessToken',
                    payload: {
                        ...validPayload,
                        accessToken: 'a'.repeat(10)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = loginResponseSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'accept valid payload with min length accessToken') {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[]
        }> = createMissingRequiredFieldCases(loginResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = loginResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const codes = result.error!.issues.map((issue) => issue.code);
                const paths = result.error!.issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type'), true);
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<LoginResponse> = {
            user: invalidNonObjectValues,
            accessToken: invalidNonStringValues
        } 

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginResponseSchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
                const code = result.error!.issues[0].code;
                const path = result.error!.issues[0].path[0];
                assert.ok(code === 'invalid_type' || code === 'invalid_format' || code === 'invalid_value');
                assert.deepStrictEqual(path, testCase.invalidField);
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
                const result = loginResponseSchema.safeParse(testCase.payload);
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
            unknownFields: Array<string>
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
                const result = await loginResponseSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issuses = result.error!.issues;
                const code = issuses[0].code;
                const path = issuses[0].path;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(path, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issuses[0].keys, testCase.unknownFields);
                }
            })
        }
    })
});
