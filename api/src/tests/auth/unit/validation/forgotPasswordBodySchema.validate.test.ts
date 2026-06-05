import { describe, it } from "node:test";
import { forgotPasswordBodySchema } from "../../../../modules/auth/auth.schemas.js";
import { uniqueEmail } from "../../../helper.js";
import assert from "node:assert";

void describe('forgotPasswordBodySchema', () => {
    void it('accept valid payload', async () => {
        const payload = {
            email: `${uniqueEmail()}`
        };

        const result = forgotPasswordBodySchema.safeParse(payload);

        assert.ok(result.success);
        assert.deepEqual(result.data, payload);
    });

    void it('email transform', async () => {
        const email = `   Thuc12032001@gmail.com   `
        const result = forgotPasswordBodySchema.safeParse({
            email
        });

        assert.ok(result.success);
        assert.equal(result.data.email, email.trim().toLowerCase());
    });

    void it('missing required field', async () => {
        const result = forgotPasswordBodySchema.safeParse({});

        assert.equal(result.success, false);
    });

    void it('invalid email value', async (t) => {
        const cases: Array<{
            title: string;
            email: string;
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
                    title: 'email only spaces',
                    email: '   ',
                },
                {
                    title: 'email missing @ symbol',
                    email: 'abcgmail.com',
                },
                {
                    title: 'email multiple @ symbols',
                    email: 'a@@gmail.com',
                },
                {
                    title: 'email missing local part before @',
                    email: '@gmail.com',
                },
                {
                    title: 'email missing domain after @',
                    email: 'abc@',
                },
                {
                    title: 'email missing dot in domain',
                    email: 'abc@gmail',
                },
                {
                    title: 'email local part starts with dot',
                    email: '.abc@gmail.com',
                },
                {
                    title: 'email local part ends with dot',
                    email: 'abc.@gmail.com',
                },
                {
                    title: 'email consecutive dots in local part',
                    email: 'ab..c@gmail.com',
                },
                {
                    title: 'email consecutive dots in domain',
                    email: 'abc@gmail..com',
                },
                {
                    title: 'email invalid special characters in local part',
                    email: 'abc<>@gmail.com',
                },
                {
                    title: 'email invalid underscore in domain',
                    email: 'abc@gma_il.com',
                },
                {
                    title: 'email top-level domain too short',
                    email: 'abc@gmail.c',
                },
                {
                    title: 'email contains newline',
                    email: 'abc@gmail\n.com',
                },
                {
                    title: 'email contains tab',
                    email: 'abc@gmail\t.com',
                },
                {
                    title: 'email contains carriage return',
                    email: 'abc@gmail\r.com',
                },
                {
                    title: 'email contains vertical tab',
                    email: 'abc@gmail\v.com',
                },
                {
                    title: 'email contains form feed',
                    email: 'abc@gmail\f.com',
                },
                {
                    title: 'email contains backspace',
                    email: 'abc@gmail\b.com',
                },
                {
                    title: 'email contains backspace',
                    email: 'abc@gmail\b.com',
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = forgotPasswordBodySchema.safeParse({
                    email: testCase.email
                });
                assert.equal(result.success, false);
            });
        }
    });

    void it('invalid email type', async (t) => {
        const cases: Array<{
            title: string;
            email: unknown;
        }> = [
                {
                    title: 'email invalid type (null)',
                    email: null,
                },
                {
                    title: 'email invalid type (number)',
                    email: 123,
                },
                {
                    title: 'email invalid type (boolean)',
                    email: true,
                },
                {
                    title: 'email invalid type (array)',
                    email: [],
                },
                {
                    title: 'email invalid type (object)',
                    email: {},
                },
                {
                    title: 'email invalid type (symbol)',
                    email: Symbol(),
                },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = forgotPasswordBodySchema.safeParse({
                    email: testCase.email
                });
                assert.equal(result.success, false);
            });
        }
    });

    void it('strict object/unknown field', async (t) => {
        const cases: Array<{
            title: string;
            payload: {};
        }> = [
                {
                    title: 'unknown field',
                    payload: {
                        email: `${uniqueEmail()}`,
                        unknown: 'unknown',
                    },
                },
                {
                    title: 'multiple unknown fields',
                    payload: {
                        email: `${uniqueEmail()}`,
                        unknown1: 'unknown1',
                        unknown2: 'unknown2',
                    },
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = forgotPasswordBodySchema.safeParse(testCase.payload);
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
                },
                {
                    title: 'payload invalid type (date)',
                    payload: new Date(),
                },
                {
                    title: 'payload invalid type (undefined)',
                    payload: undefined,
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = forgotPasswordBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
            });
        }
    });

    void it('invalid/missing email', async () => {
        const result = forgotPasswordBodySchema.safeParse({});
        assert.equal(result.success, false);
        assert.deepEqual(result.error!.issues[0].path, ['email']);
        assert.deepEqual(result.error!.issues[0].code, 'invalid_type');
    });

    void it('unknown field', async () => {
        const result = forgotPasswordBodySchema.safeParse({
            email: `${uniqueEmail()}`,
            unknown: 'unknown',
        });
        assert.equal(result.success, false);

        const issue = result.error!.issues[0];

        assert.equal(issue.code, 'unrecognized_keys');
        assert.deepStrictEqual(issue.path, []);
        if (issue.code === 'unrecognized_keys') {
            assert.deepStrictEqual(issue.keys, ['unknown']);
        }
    });
});