import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { uniqueEmail } from "../../../helper.js";
import { registerResponseSchema, type RegisterResponse } from "../../../../modules/auth/auth.schemas.js";
import assert from "node:assert";
import { invalidNonStringValues } from "../../../validationTestValues.js";

void describe('registerResponseSchema', () => {
    void it('accept valid payload', async () => {
        const payload: RegisterResponse = {
            user: {
                id: `${randomUUID()}`,
                name: 'Test User',
                email: `  ${uniqueEmail()}  `,
            },
            accessToken: 'accessToken'
        }

        const result = registerResponseSchema.safeParse(payload);

        assert.ok(result.success);
        payload.user.email = payload.user.email.trim().toLowerCase();
        assert.deepEqual(result.data, payload);
    });

    void it('rejects when required fields is missing', async (t) => { 
         
        const cases: Array<{
            title: string,
            payload: {}
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
                    title: 'missing both user and accessToken',
                    payload: {}
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = registerResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
            });
        }
    });

    void it('rejects when nested user invalid', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown; 
        }> = 
        [
            ...invalidNonStringValues.map((testValue) => ({
                title: `email invalid type (${testValue.label})`,
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: testValue.value
                    },
                    accessToken: 'accessToken'
                }
            })),
            ...invalidNonStringValues.map((testValue) => ({
                title: `name invalid type (${testValue.label})`,
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: testValue.value,
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken'
                }
            })),
            ...invalidNonStringValues.map((testValue) => ({
                title: `id invalid type (${testValue.label})`,
                payload: {
                    user: {
                        id: testValue.value,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken'
                }
            }))
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = registerResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false); 
            })
        }
    });

    void it('rejects accessToken invalid', async (t) => {
        const cases: Array<{
          title: string;
          payload: unknown;  
        }> = [
            ...invalidNonStringValues.map((testValue) => ({
                title: `accessToken invalid type (${testValue.label})`,
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: testValue.value
                }
            }))
        ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = registerResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false); 
            })
        }
    });

    void it('accept accessToken length exactly 10 chars', async (t) => {
        const cases: Array<{
          title: string;
          payload: RegisterResponse;  
        }> = [
            {
                title: 'accessToken length exactly 10 chars',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken'
                }
            },
            {
                title: 'accessToken length exactly 10 chars after trim',
                payload: {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: `  ${uniqueEmail()}  `,
                    },
                    accessToken: 'accessToken'
                }
            }
        ]; 

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = registerResponseSchema.safeParse(testCase.payload);
                assert.ok(result.success);
            })
        }
    });
});