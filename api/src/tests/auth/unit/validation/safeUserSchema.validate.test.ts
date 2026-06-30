import { describe, it } from "node:test";
import { safeUserSchema, type SafeUserResponse } from "../../../../modules/auth/auth.schemas.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, type InvalidCasesByField } from "../../../helper.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: SafeUserResponse = {
    id: `${randomUUID()}`,
    name: 'Test User',
    email: `${uniqueEmail()}`,
}

void describe('safeUserSchema', () => {
    void it('accepts valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: SafeUserResponse;
        }> = [
                {
                    title: 'accepts valid payload',
                    payload: validPayload
                },
                {
                    title: 'accepts valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `   ${validPayload.name}   `
                    }
                },
                {
                    title: 'accepts valid payload with exactly min length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(2)
                    }
                },
                {
                    title: 'accepts valid payload with exactly max length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = safeUserSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                testCase.payload.name = testCase.payload.name.trim();
                assert.deepStrictEqual(result.data, testCase.payload);
            })
        }
    });

    void it('rejects greater than max/min name length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'rejects greater than max name length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(101)
                    }
                },
                {
                    title: 'rejects less than min name length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(1)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeUserSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'too_big' || issues.code === 'too_small');
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeUserResponse> = {
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            email: invalidNonStringValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeUserSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path, [testCase.invalidField]);
            })
        }
    });

    void it('rejects missing reuqired fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[]
        }> = createMissingRequiredFieldCases(safeUserSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeUserSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const codes = result.error!.issues.map((issue) => issue.code);
                const paths = result.error!.issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type'), true);
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });
});
