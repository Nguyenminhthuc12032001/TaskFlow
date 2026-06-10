import { describe, it } from "node:test";
import { loginResponseSchema, type LoginResponse } from "../../../../modules/auth/auth.schemas.js";
import { uniqueEmail } from "../../../helper.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonStringValues } from "../../../validationTestValues.js";

void describe('login_refreshResponseSchema', () => {
    void it('accept valid payload', async () => {
        const payload: LoginResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: `  ${uniqueEmail()}  `,
            },
            accessToken: 'accessToken'
        }

        const result = loginResponseSchema.safeParse(payload);

        assert.ok(result.success);
        payload.user.email = payload.user.email.trim().toLowerCase();
        assert.deepEqual(result.data, payload);
    });

    void it('rejects missing required fields', async () => {
        const cases: Array<{
          title: string;
          payload: Partial<LoginResponse>;  
        }> = [
            {
                title: 'missing user',
                payload: {
                    accessToken: 'accessToken'
                }
            },
            {
                title: 'missing accessToken',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    }
                }
            },
            {
                title: 'missing user and accessToken',
                payload: {}
            },
        ]

        for (const testCase of cases) {
            await it(testCase.title, async () => {
                const result = loginResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
            });
        }
    });

    void it('rejects when nested user invalid', async () => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
            {
                title: 'missing id',
                payload: {
                    user: {
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken'
                }
            },
            {
                title: 'missing name',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken'
                }
            },
            {
                title: 'missing email',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                    },
                    accessToken: 'accessToken'
                }
            },
            {
                title: 'missing email and name',
                payload: {
                    user: {
                        id: `${randomUUID()}`
                    },
                    accessToken: 'accessToken'
                }
            },
            {
                title: 'missing email and id',
                payload: {
                    user: {
                        name: 'Test User'
                    },
                    accessToken: 'accessToken'
                }
            },
            {
                title: 'missing name and id',
                payload: {
                    user: {
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken'
                }
            },
            {
                title: 'missing email, name and id',
                payload: {
                    user: {},
                    accessToken: 'accessToken'
                }
            }
        ]

        for (const testCase of cases) {
            await it(testCase.title, async () => {
                const result = loginResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
            });
        }
    });

    void it('rejects when accessToken invalid', async () => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
            {
                title: 'missing accessToken',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    }
                }
            },
                {
                    title: 'empty accessToken',
                    payload: {
                        user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                        accessToken: ''
                    }
                },
            {
                title: 'whitespace accessToken',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: '   '
                }
            },
            ...invalidNonStringValues.map((testValue) => ({
                title: `${testValue.label} accessToken`,
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: testValue.value
                }
            })),
        ];

        for (const testCase of cases) {
            await it(testCase.title, async () => {
                const result = loginResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects when strict object invalid', async () => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedKeys: Array<string>;
        }> = [
            {
                title: 'unknown key',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken',
                    unknown: 'unknown'
                },
                unrecognizedKeys: ['unknown']
            }, 
            {
                title: 'multiple unknown keys',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken',
                    unknown1: 'unknown1',
                    unknown2: 'unknown2'
                },
                unrecognizedKeys: ['unknown1', 'unknown2']
            },
            {
                title: 'passwordHash is not allowed',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken',
                    passwordHash: 'passwordHash'
                },
                unrecognizedKeys: ['passwordHash']
            },
            {
                title: 'refreshToken is not allowed',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken',
                    refreshToken: 'refreshToken'
                },
                unrecognizedKeys: ['refreshToken']
            }
        ];

        for (const testCase of cases) {
            await it(testCase.title, async () => {
                const result = loginResponseSchema.safeParse(testCase.payload);

                const issue = result.error!.issues[0];
                assert.equal(result.success, false);

                assert.equal(issue.code, 'unrecognized_keys');
                assert.deepStrictEqual(issue.path, []);
                if (issue.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issue.keys, testCase.unrecognizedKeys);
                }
            });
        }
    });

    void it('rejects when wrong type payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
            {
                title: 'null',
                payload: null
            },
            {
                title: 'number',
                payload: 123
            },
            {
                title: 'boolean',
                payload: true
            },
            {
                title: 'array',
                payload: []
            },
            {
                title: 'empty object',
                payload: {}
            }, 
            {
                title: 'string',
                payload: 'string'
            },
            {
                title: 'date',
                payload: new Date()
            },
            {
                title: 'symbol',
                payload: Symbol()
            },
            {
                title: 'undefined',
                payload: undefined
            },
            {
                title: 'function',
                payload: () => {}
            },
            {
                title: 'empty string',
                payload: '   '
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = loginResponseSchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            })
        }
    });
});
