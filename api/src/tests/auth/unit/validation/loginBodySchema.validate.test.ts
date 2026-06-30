import assert from "node:assert";
import { loginBodySchema, type LoginBody } from "../../../../modules/auth/auth.schemas.js";
import { describe, it } from "node:test";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: LoginBody = {
    email: `${uniqueEmail()}`,
    password: 'password123',
};

void describe('loginBodySchema', () => {
    void it('accepts valid payload', async () => {
        const result = loginBodySchema.safeParse(validPayload);

        assert.ok(result.success);
        assert.deepEqual(result.data, validPayload);
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[]
        }> = createMissingRequiredFieldCases(loginBodySchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = loginBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const codes = result.error!.issues.map((issue) => issue.code);
                const paths = result.error!.issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type'), true);
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('invalid required fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<LoginBody> = {
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
                const result = loginBodySchema.safeParse(testCase.payload);

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
                const result = loginBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false); 
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: {};
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'unknown field',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        unknown: 'unknown',
                    },
                    unrecognizedKeys: ['unknown'],
                },
                {
                    title: 'multiple unknown fields',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        unknown1: 'unknown1',
                        unknown2: 'unknown2',
                    },
                    unrecognizedKeys: ['unknown1', 'unknown2'],
                },
                {
                    title: 'passwordHash is not allowed',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        passwordHash: 'passwordHash',
                    },
                    unrecognizedKeys: ['passwordHash'],
                },
                {
                    title: 'passwordSalt is not allowed',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        passwordSalt: 'passwordSalt',
                    },
                    unrecognizedKeys: ['passwordSalt'],
                },
                {
                    title: 'refreshToken is not allowed',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        refreshToken: 'refreshToken',
                    },
                    unrecognizedKeys: ['refreshToken'],
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginBodySchema.safeParse(testCase.payload);

                const issue = result.error!.issues[0];

                assert.equal(result.success, false);
                assert.equal(issue.code, 'unrecognized_keys');
                assert.deepStrictEqual(issue.path, []);
                if (issue.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issue.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });
});
