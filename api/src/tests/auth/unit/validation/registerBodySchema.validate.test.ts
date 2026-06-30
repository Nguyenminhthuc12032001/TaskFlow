import assert from "node:assert";
import { registerBodySchema, type RegisterBody } from "../../../../modules/auth/auth.schemas.js";
import { describe, it } from "node:test";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: RegisterBody = {
    name: 'Test User',
    email: `${uniqueEmail()}`,
    password: 'password123',
};

void describe('registerBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: RegisterBody;
        }> = [
                {
                    title: 'valid payload',
                    payload: validPayload,
                },
                {
                    title: 'accept valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `   ${validPayload.name}   `,
                    },
                },
                {
                    title: 'accept valid payload with exactly max length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100),
                    },
                },
                {
                    title: 'accept valid payload with exactly min length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(2),
                    },
                }
            ]

            for (const testCase of cases) {
                await t.test(testCase.title, () => {
                    const result = registerBodySchema.safeParse(testCase.payload);
                    assert.ok(result.success);
                    testCase.payload.name = testCase.payload.name.trim();
                    assert.deepStrictEqual(result.data, testCase.payload);
                })
            }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[]
        }> = createMissingRequiredFieldCases(registerBodySchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = registerBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const codes = result.error!.issues.map((issue) => issue.code);
                const paths = result.error!.issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type'), true);
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<RegisterBody> = {
            name: invalidNonStringValues,
            email: invalidNonStringValues,
            password: invalidNonStringValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse(testCase.payload);

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
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'unknown field',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        unknown: 'unknown',
                    },
                    unrecognizedKeys: ['unknown'],
                },
                {
                    title: 'multiple unknown fields',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        unknown1: 'unknown1',
                        unknown2: 'unknown2',
                    },
                    unrecognizedKeys: ['unknown1', 'unknown2'],
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
                const issue = result.error!.issues[0];
                assert.equal(issue.code, 'unrecognized_keys');
                assert.deepStrictEqual(issue.path, []);
                if (issue.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issue.keys, testCase.unrecognizedKeys);
                }
            });
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
                const result = registerBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false); 
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
            })
        }
    });
});
