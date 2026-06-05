import assert from "node:assert";
import { passwordSchema } from "../../../../modules/auth/auth.schemas.js";
import { describe, it } from "node:test";

void describe('passwordSchema', () => {
    // valid cases
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
                const result = passwordSchema.safeParse(testCase.password);

                assert.ok(result.success);
                assert.equal(result.data, testCase.password);
            });
        }
    });

    void it('accept normal password within range', async () => {
        const result = passwordSchema.safeParse('a'.repeat(16));

        assert.ok(result.success);
        assert.equal(result.data, 'a'.repeat(16));
    });

    void it('rejects password with surrounding whitespace if trimmed result is valid', async () => {
        const password = '   a'.repeat(16) + '   ';
        const result = passwordSchema.safeParse(password);

        assert.equal(result.success, true);
    });

    // invalid length cases
    void it('rejects when password length is invalid', async (t) => {
        const cases: Array<{
            title: string;
            password: string;
        }> = [
                {
                    title: 'password length less than min',
                    password: 'a'.repeat(7)
                },
                {
                    title: 'password length greater than max',
                    password: 'a'.repeat(73)
                },
                {
                    title: 'password empty',
                    password: ''
                },
                {
                    title: 'password whitespace only',
                    password: '   '
                },
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = passwordSchema.safeParse(testCase.password);

                assert.equal(result.success, false);
            });
        }
    });

    // invalid type cases
    void it('rejects when password is invalid type', async (t) => {
        const cases: Array<{
            title: string;
            password: unknown;
        }> = [
                {
                    title: 'password is null',
                    password: null,
                },
                {
                    title: 'password is number',
                    password: 12345678,
                },
                {
                    title: 'password is boolean',
                    password: true,
                },
                {
                    title: 'password is object',
                    password: {},
                },
                {
                    title: 'password is array',
                    password: ['a'.repeat(16)],
                },
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = passwordSchema.safeParse(testCase.password);

                assert.equal(result.success, false);
            });
        }
    });
});