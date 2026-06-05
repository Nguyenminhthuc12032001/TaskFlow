import { describe, it } from "node:test";
import { resetPasswordBodySchema, type ResetPasswordBody } from "../../../../modules/auth/auth.schemas.js";
import assert from "node:assert";

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
                {
                    title: 'resetToken invalid type (null)',
                    payload: {
                        resetToken: null,
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken invalid type (number)',
                    payload: {
                        resetToken: 123,
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken invalid type (boolean)',
                    payload: {
                        resetToken: true,
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken invalid type (object)',
                    payload: {
                        resetToken: {},
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken invalid type (array)',
                    payload: {
                        resetToken: [],
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken invalid type (date)',
                    payload: {
                        resetToken: new Date(),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken invalid type (symbol)',
                    payload: {
                        resetToken: Symbol(),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken invalid type (undefined)',
                    payload: {
                        resetToken: undefined,
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'resetToken invalid type (function)',
                    payload: {
                        resetToken: () => { },
                        newPassword: 'password123'
                    }
                },
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
                {
                    title: 'newPassword invalid type (null)',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: null
                    }
                },
                {
                    title: 'newPassword invalid type (number)',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: 123
                    }
                },
                {
                    title: 'newPassword invalid type (boolean)',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: true
                    }
                },
                {
                    title: 'newPassword invalid type (object)',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: {}
                    }
                },
                {
                    title: 'newPassword invalid type (array)',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: []
                    }
                },
                {
                    title: 'newPassword invalid type (date)',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: new Date()
                    }
                },
                {
                    title: 'newPassword invalid type (symbol)',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: Symbol()
                    }
                },
                {
                    title: 'newPassword invalid type (undefined)',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: undefined
                    }
                },
                {
                    title: 'newPassword invalid type (function)',
                    payload: {
                        resetToken: 'a'.repeat(10),
                        newPassword: () => { }
                    }
                },
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

        // assert issue code là unrecognized_keys nếu muốn chắc strict behavior
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