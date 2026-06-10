import assert from "node:assert";
import { loginBodySchema, type LoginBody } from "../../../../modules/auth/auth.schemas.js";
import { describe, it } from "node:test";
import { uniqueEmail } from "../../../helper.js";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

void describe('loginBodySchema', () => {
    void it('accept valid payload', async () => {
        const payload: LoginBody = {
            email: `${uniqueEmail()}`,
            password: 'password123',
        };

        const result = loginBodySchema.safeParse(payload);

        assert.equal(result.success, true);
    });

    void it('trim/lowercase email', async () => {
        const payload: LoginBody = {
            email: `   ${uniqueEmail()}   `,
            password: 'password123',
        };

        const result = loginBodySchema.safeParse(payload);

        assert.ok(result.success);
        assert.equal(result.data.email, payload.email.trim().toLowerCase());
    });

    void it('accept exactly password length', async (t) => {
        const cases: Array<{
            title: string;
            password: string;
        }> = [
                {
                    title: 'password length exactly max',
                    password: 'a'.repeat(72)
                },
                {
                    title: 'password length exactly min',
                    password: 'a'.repeat(8)
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginBodySchema.safeParse({
                    email: `${uniqueEmail()}`,
                    password: testCase.password,
                });

                assert.equal(result.success, true);
            });
        }
    });

    void it('missing field cases', async (t) => {
        const cases: Array<{
            title: string;
            payload: {};
        }> = [
                {
                    title: 'missing email',
                    payload: {
                        password: 'password123',
                    },
                },
                {
                    title: 'missing password',
                    payload: {
                        email: `${uniqueEmail()}`,
                    },
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });

    void it('invalid email cases', async (t) => {
        const cases: Array<{
            title: string;
            email: unknown;
        }> = [
                {
                    title: 'invalid email format',
                    email: 'invalid-email-format',
                },
                {
                    title: 'email empty',
                    email: '',
                },
                {
                    title: 'email whitespace only',
                    email: '   ',
                },
                ...invalidNonStringValues.map((testValue) => ({
                    title: `email invalid type (${testValue.label})`,
                    email: testValue.value,
                })),
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginBodySchema.safeParse({
                    email: testCase.email,
                    password: 'password123',
                });

                assert.equal(result.success, false);
            });
        }
    });

    void it('invalid password cases', async (t) => {
        const cases: Array<{
            title: string;
            password: unknown;
        }> = [
                {
                    title: 'password empty',
                    password: '',
                },
                {
                    title: 'password whitespace only',
                    password: '   ',
                },
                {
                    title: 'password length less than min',
                    password: 'a'.repeat(7)
                },
                {
                    title: 'password length greater than max',
                    password: 'a'.repeat(73)
                },
                ...invalidNonStringValues.map((testValue) => ({
                    title: `password invalid type (${testValue.label})`,
                    password: testValue.value,
                })),
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginBodySchema.safeParse({
                    email: `${uniqueEmail()}`,
                    password: testCase.password,
                });

                assert.equal(result.success, false);
            });
        }
    });

    void it('strict object cases', async (t) => {
        const cases: Array<{
            title: string;
            payload: {};
        }> = [
                {
                    title: 'unknown field',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        unknown: 'unknown',
                    },
                },
                {
                    title: 'multiple unknown fields',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        unknown1: 'unknown1',
                        unknown2: 'unknown2',
                    },
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            })
        }
    });

    void it('accept exactly password length', async (t) => { 

        const cases: Array<{
            title: string;
            payload: LoginBody;
        }> = [
                {
                    title: 'password length exactly max',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'a'.repeat(72)
                    }
                },
                {
                    title: 'password length exactly min',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'a'.repeat(8)
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, true);
            });
        }
    });

    void it('wrong payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'payload invalid type (null)',
                    payload: null,
                },
                {
                    title: 'payload invalid type (number)',
                    payload: 123,
                },
                {
                    title: 'payload invalid type (boolean)',
                    payload: true,
                },
                {
                    title: 'payload invalid type (array)',
                    payload: [],
                },
                {
                    title: 'payload invalid type (string)',
                    payload: 'a'.repeat(100),
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects strict object', async (t) => {
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

    void it('wrong payload type', async (t) => {
        const cases: Array<{
          title: string;
          payload: unknown;  
        }> = [
            ...invalidNonObjectValues.map((testValue) => ({
                title: `payload invalid type (${testValue.label})`,
                payload: testValue.value,
            }))
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = loginBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false); 
            })
        }
    });
});
