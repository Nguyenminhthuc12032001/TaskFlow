import { describe, it } from "node:test";
import { resetPasswordBodySchema, type ResetPasswordBody } from "../../../../modules/auth/auth.schemas.js";
import assert from "node:assert";
import { invalidNonStringValues } from "../../../validationTestValues.js";

void describe('resetPasswordBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string,
            payload: ResetPasswordBody
        }> = [
                {
                    title: 'accept resetToken length exactly min',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'accept resetToken length longer than min',
                    payload: {
                        resetToken: 'a'.repeat(11),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'accept resetPassword length exactly min',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'accept resetPassword length exactly max',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: 'password1234'
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, true);
            });
        }
    });

    void it('rejects required fields is missing', async (t) => {
        const cases: Array<{
            title: string,
            payload: {}
        }> = [
                {
                    title: 'missing resetToken',
                    payload: {
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'missing newPassword',
                    payload: {
                        resetToken: 'a'.repeat(10)
                    }
                },
                {
                    title: 'missing both resetToken and newPassword',
                    payload: {}
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects invalid resetToken', async (t) => {
        const cases: Array<{
            title: string;
            payload: {
                resetToken: unknown;
                newPassword: string;
            }
        }> = [
                ...invalidNonStringValues.map((testValue) => ({
                    title: `resetToken invalid type (${testValue.label})`,
                    payload: {
                        resetToken: testValue.value,
                        newPassword: 'password123'
                    }
                })),
                {
                    title: 'resetToken invalid length (shorter than min)',
                    payload: {
                        resetToken: 'a'.repeat(9),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken is empty',
                    payload: {
                        resetToken: '',
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken is whitespace only',
                    payload: {
                        resetToken: '              ',
                        newPassword: 'password123'
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });

    void it('rejects when newPassword is invalid', async (t) => {
        const cases: Array<{
            title: string;
            payload: {
                resetToken: string;
                newPassword: unknown;
            }
        }> = [
                ...invalidNonStringValues.map((testValue) => ({
                    title: `newPassword invalid type (${testValue.label})`,
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: testValue.value
                    }
                })),
                {
                    title: 'newPassword is empty',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: ''
                    }
                },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    });

    void it('strict object', async (t) => {
        const cases: Array<{
            title: string;
            payload: {};
        }> = [
                {
                    title: 'unknown fields are not allowed',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: 'password123',
                        unknown: 'unknown'
                    }
                },
                {
                    title: 'multiple unknown fields are not allowed',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: 'password123',
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    }
                }
            ]
 
        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);

                const issue = result.error!.issues[0];

                assert.equal(issue.code, 'unrecognized_keys');
            });
        }
    });

    void it('rejects invalid payload type', async (t) => {
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
                },
                {
                    title: 'invalid type (buffer)',
                    payload: Buffer.from('a'.repeat(100))
                },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = resetPasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            });
        }
    })
});
