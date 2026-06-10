import { describe, it } from "node:test";
import { safeUserSchema, type SafeUserResponse } from "../../../../modules/auth/auth.schemas.js";
import { uniqueEmail } from "../../../helper.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonStringValues } from "../../../validationTestValues.js";

void describe('safeUserSchema', () => {
    void it('accept valid payload', async () => {
        const payload: SafeUserResponse = {
            id: `${randomUUID()}`,
            name: 'Test User',
            email: `  ${uniqueEmail()}  `,
        };

        const result = safeUserSchema.safeParse(payload);

        assert.ok(result.success);
        payload.email = payload.email.trim().toLowerCase();
        assert.deepEqual(result.data, payload);
    });

    void it('rejects when missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: Partial<SafeUserResponse>;
        }> = [
                {
                    title: 'missing id',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`
                    }
                },
                {
                    title: 'missing name',
                    payload: {
                        id: `${randomUUID()}`,
                        email: `${uniqueEmail()}`
                    }
                },
                {
                    title: 'missing email',
                    payload: {
                        id: `${randomUUID()}`,
                        name: 'Test User'
                    }
                },
                {
                    title: 'missing email and name',
                    payload: {
                        id: `${randomUUID()}`
                    }
                },
                {
                    title: 'missing email and id',
                    payload: {
                        name: 'Test User'
                    }
                },
                {
                    title: 'missing name and id',
                    payload: {
                        email: `${uniqueEmail()}`
                    }
                },
                {
                    title: 'missing all fields',
                    payload: {}
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeUserSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects when id invalid', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'invalid id',
                    payload: {
                        id: 'invalid',
                        name: 'Test User',
                        email: `${uniqueEmail()}`
                    }
                },
                {
                    title: 'empty id',
                    payload: {
                        id: '',
                        name: 'Test User',
                        email: `${uniqueEmail()}`
                    }
                },
                {
                    title: 'whitespace id',
                    payload: {
                        id: '   ',
                        name: 'Test User',
                        email: `${uniqueEmail()}`
                    }
                },
                ...invalidNonStringValues.map((testValue) => ({
                    title: `${testValue.label} id`,
                    payload: {
                        id: testValue.value,
                        name: 'Test User',
                        email: `${uniqueEmail()}`
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeUserSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects invalid name', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'empty name',
                    payload: {
                        id: `${randomUUID()}`,
                        name: '',
                        email: `${uniqueEmail()}`
                    }
                },
                {
                    title: 'whitespace name',
                    payload: {
                        id: `${randomUUID()}`,
                        name: '   ',
                        email: `${uniqueEmail()}`
                    }
                },
                ...invalidNonStringValues.map((testValue) => ({
                    title: `${testValue.label} name`,
                    payload: {
                        id: `${randomUUID()}`,
                        name: testValue.value,
                        email: `${uniqueEmail()}`
                    }
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeUserSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects invalid email', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'empty email',
                    payload: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: ''
                    }
                },
                ...invalidNonStringValues.map((testValue) => ({
                    title: `${testValue.label} email`,
                    payload: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: testValue.value
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeUserSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects invalid strict object/security mode', async (t) => {
        const cases: Array<{
            title: string;
            payload: {};
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'unknown fields are not allowed',
                    payload: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        unknown: 'unknown'
                    },
                    unrecognizedKeys: ['unknown']
                },
                {
                    title: 'multiple unknown fields are not allowed',
                    payload: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    },
                    unrecognizedKeys: ['unknown1', 'unknown2']
                },
                {
                    title: 'passwordHash is not allowed',
                    payload: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        passwordHash: 'passwordHash'
                    },
                    unrecognizedKeys: ['passwordHash']
                },
                {
                    title: 'refreshToken is not allowed',
                    payload: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        refreshToken: 'refreshToken'
                    },
                    unrecognizedKeys: ['refreshToken']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeUserSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);

                const issue = result.error!.issues[0];

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
            {
                title: 'invalid type (null)',
                payload: null
            },
            {
                title: 'invalid type (number)',
                payload: 123
            },
            {
                title: 'invalid type (boolean)',
                payload: true
            },
            {
                title: 'invalid type (object)',
                payload: {}
            },
            {
                title: 'invalid type (array)',
                payload: []
            },
            {
                title: 'invalid type (date)',
                payload: new Date()
            },
            {
                title: 'invalid type (symbol)',
                payload: Symbol()
            },
            {
                title: 'invalid type (undefined)',
                payload: undefined
            },
            {
                title: 'invalid type (function)',
                payload: () => { }
            },
            {
                title: 'invalid type (string)',
                payload: 'a'.repeat(100)
            },
            {
                title: 'invalid type (bigint)',
                payload: BigInt(1)
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = safeUserSchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });
});
