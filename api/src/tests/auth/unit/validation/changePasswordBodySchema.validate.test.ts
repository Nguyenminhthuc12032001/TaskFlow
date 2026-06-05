import { describe, it } from "node:test";
import { changePasswordBodySchema, type ChangePasswordBody } from "../../../../modules/auth/auth.schemas.js";
import assert from "node:assert";

void describe('changePasswordBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: ChangePasswordBody;
        }> = [
                {
                    title: 'valid payload',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'valid payload with ',
                    payload: {
                        currentPassword: '  password123 ',
                        newPassword: ' password1234   '
                    }
                },
                {
                    title: 'new password exactly min length',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 'a'.repeat(8)
                    }
                },
                {
                    title: 'new password exactly max length',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 'a'.repeat(72)
                    }
                },
                {
                    title: 'current password exactly min length',
                    payload: {
                        currentPassword: 'a'.repeat(8),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'current password exactly max length',
                    payload: {
                        currentPassword: 'a'.repeat(72),
                        newPassword: 'password123'
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = changePasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, true);
                assert.deepEqual(result.data, testCase.payload);
            })
        }
    });

    void it('rejects missing required field', async (t) => {
        const cases: Array<{
            title: string,
            payload: Partial<ChangePasswordBody>
        }> = [
                {
                    title: 'missing currentPassword',
                    payload: {
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'missing newPassword',
                    payload: {
                        currentPassword: 'password123'
                    }
                },
                {
                    title: 'missing both currentPassword and newPassword',
                    payload: {}
                }
            ];
            
            for (const testCase of cases) {
                await t.test(testCase.title, () => {
                    const result = changePasswordBodySchema.safeParse(testCase.payload);

                    assert.equal(result.success, false);
                })
            }
    });

    void it('rejects invalid current password', async (t) => {
        const cases: Array<{
          title: string;
          payload: { }  
        }> = [
                {
                    title: 'invalid currentPassword type (null)',
                    payload: {
                        currentPassword: null,
                        newPassword: 'password123'
                    }
                }, 
                {
                    title: 'invalid currentPassword type (number)',
                    payload: {
                        currentPassword: 123,
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword type (boolean)',
                    payload: {
                        currentPassword: true,
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword type (object)',
                    payload: {
                        currentPassword: {},
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword type (array)',
                    payload: {
                        currentPassword: [],
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword type (date)',
                    payload: {
                        currentPassword: new Date(),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword type (symbol)',
                    payload: {
                        currentPassword: Symbol(),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword type (undefined)',
                    payload: {
                        currentPassword: undefined,
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword type (function)',
                    payload: {
                        currentPassword: () => { },
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword length (longer than max)',
                    payload: {
                        currentPassword: 'a'.repeat(73),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword length (shorter than min)',
                    payload: {
                        currentPassword: 'a'.repeat(7),
                        newPassword: 'password123'
                    }
                },
                {
                    title: 'invalid currentPassword is empty',
                    payload: {
                        currentPassword: '',
                        newPassword: 'password123'
                    }
                },
            ]; 

            for (const testCase of cases) {
                await t.test(testCase.title, () => {
                    const result = changePasswordBodySchema.safeParse(testCase.payload);

                    assert.equal(result.success, false);
                })
            }
    });

    void it('rejects invalid new password', async (t) => {
        const cases: Array<{
          title: string;
          payload: { }  
        }> = [
                {
                    title: 'invalid newPassword type (null)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: null
                    }
                }, 
                {
                    title: 'invalid newPassword type (number)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 123
                    }
                },
                {
                    title: 'invalid newPassword type (boolean)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: true
                    }
                },
                {
                    title: 'invalid newPassword type (object)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: {}
                    }
                },
                {
                    title: 'invalid newPassword type (array)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: []
                    }
                },
                {
                    title: 'invalid newPassword type (date)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: new Date()
                    }
                },
                {
                    title: 'invalid newPassword type (symbol)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: Symbol()
                    }
                },
                {
                    title: 'invalid newPassword type (undefined)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: undefined
                    }
                },
                {
                    title: 'invalid newPassword type (function)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: () => { }
                    }
                },
                {
                    title: 'invalid newPassword length (longer than max)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 'a'.repeat(73)
                    }
                },
                {
                    title: 'invalid newPassword length (shorter than min)',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 'a'.repeat(7)
                    }
                },
                {
                    title: 'invalid newPassword is empty',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: ''
                    }
                }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = changePasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            })
        }
    });

    void it('rejects strict object mode', async (t) => {
        const cases: Array<{
          title: string;
          payload: { }  
        }> = [
                {
                    title: 'unknown fields are not allowed',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 'password123',
                        unknown: 'unknown'
                    }
                },
                {
                    title: 'multiple unknown fields are not allowed',
                    payload: {
                        currentPassword: 'password123',
                        newPassword: 'password123',
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    }
                }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = changePasswordBodySchema.safeParse(testCase.payload);

                assert.equal(result.success, false);
            })
        }
    });

    void it('rejects wrong payload type', async (t) => {
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
                },
                {
                    title: 'payload invalid type (date)',
                    payload: new Date(),
                }
            ];

            for (const testCase of cases) {
                await t.test(testCase.title, () => {
                    const result = changePasswordBodySchema.safeParse(testCase.payload);

                    assert.equal(result.success, false);
                })
            }
    });
});