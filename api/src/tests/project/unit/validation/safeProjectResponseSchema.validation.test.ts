import { describe, it } from "node:test";
import { safeProjectResponseSchema, type SafeProjectResponseType } from "../../../../modules/project/project.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: SafeProjectResponseType = {
    workspaceId: randomUUID(),
    id: randomUUID(),
    name: 'Test Project',
    description: 'This is a test project',
    createdAt: new Date(),
    createdBy: randomUUID(),
}

void describe('safeProjectResponseSchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept normal valid payload',
                    payload: validPayload
                },
                {
                    title: 'accept valid payload date ISO string',
                    payload: {
                        ...validPayload,
                        createdAt: validPayload.createdAt.toISOString()
                    }
                },
                {
                    title: 'accept valid name/description with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `,
                        description: `  ${validPayload.description}  `
                    }
                },
                {
                    title: 'accept valid name/description with exactly max length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100),
                        description: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept valid name/description with exactly min length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(2),
                        description: 'a'.repeat(10)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeProjectResponseSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'accept valid name/description with leading/trailing whitespace') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else if (testCase.title === 'accept valid payload date ISO string') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeProjectResponseType> = {
            workspaceId: invalidNonUUIDValues,
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            description: invalidNonStringValues.filter((test) => test.value !== undefined),
            createdAt: invalidNonDateValues,
            createdBy: invalidNonUUIDValues,
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeProjectResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_format');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects when name/description length exceeds max length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                {
                    title: 'rejects when name length exceeds max length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(101)
                    },
                    invalidField: 'name'
                },
                {
                    title: 'rejects when description length exceeds max length',
                    payload: {
                        ...validPayload,
                        description: 'a'.repeat(101)
                    },
                    invalidField: 'description'
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeProjectResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'too_big');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects when name/description length is less than min length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                {
                    title: 'rejects when name length is less than min length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(1)
                    },
                    invalidField: 'name'
                },
                {
                    title: 'rejects when description length is less than min length',
                    payload: {
                        ...validPayload,
                        description: 'a'.repeat(9)
                    },
                    invalidField: 'description'
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeProjectResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'too_small');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects misisng required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeProjectResponseType>;
        }> = createMissingRequiredFieldCases(safeProjectResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeProjectResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
            title: `rejects invalid payload type ${test.label}`,
            payload: test.value
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeProjectResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});