import assert from "node:assert";
import { registerBodySchema, type RegisterBody } from "../../../../modules/auth/auth.schemas.js";
import { describe, it } from "node:test";
import { uniqueEmail } from "../../../helper.js";
import { invalidNonStringValues } from "../../../validationTestValues.js";

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
                ...invalidNonStringValues.map((testValue) => ({
                    title: `name invalid type (${testValue.label})`,
                    payload: {
                        name: testValue.value,
                        email: `${uniqueEmail()}`,
                        password: 'password123',
                    },
                })),
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
        }> = invalidNonStringValues.map((testValue) => ({
            title: `email invalid type (${testValue.label})`,
            payload: {
                name: 'Test User',
                email: testValue.value,
                password: 'password123',
            },
        }));

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
        }> = invalidNonStringValues.map((testValue) => ({
            title: `password invalid type (${testValue.label})`,
            payload: {
                name: 'Test User',
                email: `${uniqueEmail()}`,
                password: testValue.value,
            },
        }));

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
