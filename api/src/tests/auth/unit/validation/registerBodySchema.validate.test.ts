import assert from "node:assert";
import { registerBodySchema, type RegisterBody } from "../../../../modules/auth/auth.schemas.js";
import { describe, it } from "node:test";
import { uniqueEmail } from "../../../helper.js";

void describe('registerBodySchema', () => {
    void it('accept valid payload', async () => {
        const payload: RegisterBody = {
            name: 'Test User',
            email: `${uniqueEmail()}`,
            password: 'password123',
        };

        const result = registerBodySchema.safeParse(payload);

        assert.ok(result.success);
        assert.deepEqual(result.data, payload);
    });

    void it('trim whitespace from name/email ', async (t) => {
        const payload: RegisterBody = {
            name: 'Test User',
            email: `${uniqueEmail()}`,
            password: 'password123',
        };

        const cases: Array<{
            title: string;
            payload: RegisterBody;
        }> = [
                {
                    title: 'trim name',
                    payload: {
                        ...payload,
                        name: '   Test User   ',
                    },
                },
                {
                    title: 'trim email',
                    payload: {
                        ...payload,
                        email: `   ${payload.email}   `,
                    },
                },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse(testCase.payload);

                assert.ok(result.success);
                assert.equal(result.data.name, testCase.payload.name.trim());
                assert.equal(result.data.email, testCase.payload.email.toLowerCase().trim());
                assert.equal(result.data.password, testCase.payload.password);
            });
        }
    });

    void it('accept name length exactly max/min', async (t) => {
        const cases: Array<{
            title: string;
            name: string;
        }> = [
                {
                    title: 'name length exactly max',
                    name: 'a'.repeat(100)
                },
                {
                    title: 'name length exactly min',
                    name: 'a'.repeat(2)
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse({
                    name: testCase.name,
                    email: `${uniqueEmail()}`,
                    password: 'password123',
                });

                assert.ok(result.success);
                assert.equal(result.data.name, testCase.name);
            });
        }
    });

    void it('accept password length exactly max/min', async (t) => {
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
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse({
                    name: 'Test User',
                    email: `${uniqueEmail()}`,
                    password: testCase.password,
                });

                assert.ok(result.success);
                assert.equal(result.data.password, testCase.password);
            });
        }
    });

    void it('rejects missing name/email/password', async (t) => {
        const cases: Array<{
            title: string;
            payload: Partial<RegisterBody>;
        }> = [
                {
                    title: 'missing name',
                    payload: {
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'missing email',
                    payload: {
                        name: 'Test User',
                        password: 'password123',
                    },
                },
                {
                    title: 'missing password',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                    },
                },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });

    void it('invalid name cases', async (t) => {
        const cases: Array<{
            title: string;
            payload: {};
        }> = [
                {
                    title: 'name length less than min',
                    payload: {
                        name: 'a'.repeat(1),
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name length greater than max',
                    payload: {
                        name: 'a'.repeat(101),
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name whitespace only',
                    payload: {
                        name: '   ',
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name invalid type (null)',
                    payload: {
                        name: null,
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name invalid type (number)',
                    payload: {
                        name: 123,
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name invalid type (boolean)',
                    payload: {
                        name: true,
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name invalid type (object)',
                    payload: {
                        name: {},
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name invalid type (array)',
                    payload: {
                        name: [],
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name invalid type (symbol)',
                    payload: {
                        name: Symbol(),
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name invalid type (undefined)',
                    payload: {
                        name: undefined,
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name invalid type (function)',
                    payload: {
                        name: () => { },
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
                {
                    title: 'name invalid type (date)',
                    payload: {
                        name: new Date(),
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                },
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });

    void it('invalid email cases', async (t) => {
        const cases: Array<{
            title: string;
            payload: {};
        }> = [
                {
                    title: 'email invalid type (null)',
                    payload: {
                        name: 'Test User',
                        email: null,
                        password: 'password123',
                    },
                },
                {
                    title: 'email invalid type (number)',
                    payload: {
                        name: 'Test User',
                        email: 123,
                        password: 'password123',
                    },
                },
                {
                    title: 'email invalid type (boolean)',
                    payload: {
                        name: 'Test User',
                        email: true,
                        password: 'password123',
                    },
                },
                {
                    title: 'email invalid type (object)',
                    payload: {
                        name: 'Test User',
                        email: {},
                        password: 'password123',
                    },
                },
                {
                    title: 'email invalid type (array)',
                    payload: {
                        name: 'Test User',
                        email: [],
                        password: 'password123',
                    },
                },
                {
                    title: 'email invalid type (symbol)',
                    payload: {
                        name: 'Test User',
                        email: Symbol(),
                        password: 'password123',
                    },
                },
                {
                    title: 'email invalid type (undefined)',
                    payload: {
                        name: 'Test User',
                        email: undefined,
                        password: 'password123',
                    },
                },
                {
                    title: 'email invalid type (function)',
                    payload: {
                        name: 'Test User',
                        email: () => { },
                        password: 'password123',
                    },
                },
                {
                    title: 'email invalid type (date)',
                    payload: {
                        name: 'Test User',
                        email: new Date(),
                        password: 'password123',
                    },
                },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });

    void it('invalid password cases', async (t) => {
        const cases: Array<{
            title: string;
            payload: {};
        }> = [
                {
                    title: 'password invalid type (null)',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: null,
                    },
                },
                {
                    title: 'password invalid type (number)',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: 123,
                    },
                },
                {
                    title: 'password invalid type (boolean)',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: true,
                    },
                },
                {
                    title: 'password invalid type (object)',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: {},
                    },
                },
                {
                    title: 'password invalid type (array)',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: [],
                    },
                },
                {
                    title: 'password invalid type (symbol)',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: Symbol(),
                    },
                },
                {
                    title: 'password invalid type (undefined)',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: undefined,
                    },
                },
                {
                    title: 'password invalid type (function)',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: () => { },
                    },
                },
                {
                    title: 'password invalid type (date)',
                    payload: {
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: new Date(),
                    },
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse(testCase.payload);

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
                        name: 'Test User',
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                        unknown: 'unknown',
                    },
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
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = registerBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
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
                const result = registerBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });
});