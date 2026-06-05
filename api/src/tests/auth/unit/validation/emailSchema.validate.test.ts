import assert from "node:assert";
import { emailSchema } from "../../../../modules/auth/auth.schemas.js";
import { describe, it } from "node:test";


void describe("emailSchema", () => {
    void it('accept valid email', () => {
        const email = 'K2bRt@example.com';

        const result = emailSchema.safeParse(email);

        assert(result.success);
        assert.equal(result.data, email.toLowerCase());
    });

    void it('trims surrounding whitespace', () => {
        const email = '   K2bRt@example.com   ';

        const result = emailSchema.safeParse(email);

        assert(result.success);
        assert.equal(result.data, email.trim().toLowerCase());
    });

    void it('normailizes to lowercase', () => {
        const email = 'K2bRt@example.com';

        const result = emailSchema.safeParse(email);

        assert(result.success);
        assert.equal(result.data, email.toLowerCase());
    });

    void it('rejects invalid email format', async (t) => {
        const cases: Array<{
            title: string;
            email: unknown;
        }> = [
                {
                    title: 'empty string',
                    email: '',
                },
                {
                    title: 'only spaces',
                    email: '   ',
                },
                {
                    title: 'missing @ symbol',
                    email: 'abcgmail.com',
                },
                {
                    title: 'multiple @ symbols',
                    email: 'a@@gmail.com',
                },
                {
                    title: 'missing local part before @',
                    email: '@gmail.com',
                },
                {
                    title: 'missing domain after @',
                    email: 'abc@',
                },
                {
                    title: 'missing dot in domain',
                    email: 'abc@gmail',
                },
                {
                    title: 'domain starts with dot',
                    email: 'abc@.gmail.com',
                },
                {
                    title: 'domain ends with dot',
                    email: 'abc@gmail.com.',
                },
                {
                    title: 'space before @',
                    email: 'abc @gmail.com',
                },
                {
                    title: 'space inside domain',
                    email: 'abc@g mail.com',
                },
                {
                    title: 'local part starts with dot',
                    email: '.abc@gmail.com',
                },
                {
                    title: 'local part ends with dot',
                    email: 'abc.@gmail.com',
                },
                {
                    title: 'consecutive dots in local part',
                    email: 'ab..c@gmail.com',
                },
                {
                    title: 'consecutive dots in domain',
                    email: 'abc@gmail..com',
                },
                {
                    title: 'invalid special characters in local part',
                    email: 'abc<>@gmail.com',
                },
                {
                    title: 'invalid underscore in domain',
                    email: 'abc@gma_il.com',
                },
                {
                    title: 'top-level domain too short',
                    email: 'abc@gmail.c',
                },
                {
                    title: 'email contains newline',
                    email: 'abc@gmail.\ncom',
                },
                {
                    title: 'email is null',
                    email: null,
                },
                {
                    title: 'email is number',
                    email: 123,
                },
                {
                    title: 'email is boolean',
                    email: true,
                },
                {
                    title: 'email is object',
                    email: {},
                },
                {
                    title: 'email is array',
                    email: ['abc@gmail.com'],
                },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = emailSchema.safeParse(testCase.email);

                assert.equal(result.success, false);
            });
        }
    });
}); 