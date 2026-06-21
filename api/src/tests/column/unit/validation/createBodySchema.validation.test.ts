import { describe, it } from "node:test";
import { createBodySchema, type CreateBodyType } from "../../../../modules/column/column.schemas.js";
import { ColumnType } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: CreateBodyType = {
    name: 'Test Column',
    type: ColumnType.todo,
    position: 1
}

void describe('createBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'valid normal payload',
                    payload: validPayload
                },
                {
                    title: 'valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `
                    }
                },
                ...Object.values(ColumnType).map((type) => ({
                    title: `valid payload with type: ${type}`,
                    payload: {
                        ...validPayload,
                        type
                    }
                })),
                {
                    title: 'accept exact max length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept max length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(99)
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, true);
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
            title: test.label,
            payload: test.value
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<CreateBodyType> = {
            name: invalidNonStringValues,
            type: invalidNonStringValues,
            position: invalidNonNumberValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'invalid_type' || result.error!.issues[0].code === 'invalid_format' || result.error!.issues[0].code === 'invalid_value');
                assert.deepStrictEqual(result.error!.issues[0].path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid name length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'rejects name too short',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(1)
                    }
                },
                {
                    title: 'rejects name too long',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(101)
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'too_small' || result.error!.issues[0].code === 'too_big');
                assert.deepStrictEqual(result.error!.issues[0].path[0], 'name');
            })
        }
    });

    void it('rejects invalid position', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonNumberValues.filter((test) => test.value !== undefined).map((test) => ({
            title: test.label,
            payload: {
                ...validPayload,
                position: test.value
            }
        })).concat([
            {
                title: 'rejects negative position',
                payload: {
                    ...validPayload,
                    position: -1
                }
            }
        ]);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'invalid_type' || result.error!.issues[0].code === 'invalid_value' || result.error!.issues[0].code === 'too_small');
                assert.deepStrictEqual(result.error!.issues[0].path[0], 'position');
            })
        }
    })

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof CreateBodyType>
        }> = createMissingRequiredFieldCases(createBodySchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unknownFields: Array<string>;
        }> = [
            {
                title: 'rejects unknown fields',
                payload: {
                    ...validPayload,
                    unknown: 'unknown'
                },
                unknownFields: ['unknown']
            },
            {
                title: 'rejects multiple unknown fields',
                payload: {
                    ...validPayload,
                    unknown: 'unknown',
                    anotherUnknown: 'anotherUnknown'
                },
                unknownFields: ['unknown', 'anotherUnknown']
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = createBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const path = issues.path;
                assert.ok(code === 'unrecognized_keys'); 
                assert.deepStrictEqual(path, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unknownFields);
                }
            })
        }
    });
});