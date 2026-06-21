import { describe, it } from "node:test";
import { safeColumnSchema, type SafeColumnType } from "../../../../modules/column/column.schemas.js";
import { randomInt, randomUUID } from "node:crypto";
import { ColumnType } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: SafeColumnType = {
    id: randomUUID(),
    projectId: randomUUID(),
    name: 'Test Column',
    position: randomInt(1, 100),
    type: ColumnType.todo,
    createdAt: new Date()
}

void describe('safeColumnSchema', () => {
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
                {
                    title: 'accept exact max length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept exact min length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(2)
                    }
                },
                {
                    title: 'accept valid position',
                    payload: {
                        ...validPayload,
                        position: randomInt(1, 100)
                    }
                },
                {
                    title: 'accept ISO date',
                    payload: {
                        ...validPayload,
                        createdAt: validPayload.createdAt.toISOString()
                    }
                },
                ...Object.values(ColumnType).map((type) => {
                    return {
                        title: `accept valid payload with type: ${type}`,
                        payload: {
                            ...validPayload,
                            type
                        }
                    }
                })
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                assert.deepEqual(result.data, testCase.payload);
            })
        }
    });

    void it('rejects beyone or below min/max length name', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'rejects below min length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(1)
                    }
                },
                {
                    title: 'rejects above max length name',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(101)
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'too_small' || result.error!.issues[0].code === 'too_big');
                assert.deepStrictEqual(result.error!.issues[0].path[0], 'name');
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
                    title: `rejects invalid payload type ${test.label}`,
                    payload: test.value
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesbyField: InvalidCasesByField<SafeColumnType> = {
            id: invalidNonUUIDValues,
            projectId: invalidNonUUIDValues,
            name: invalidNonStringValues,
            position: invalidNonNumberValues,
            type: invalidNonStringValues,
            createdAt: invalidNonDateValues,
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = [
                ...createSingleInvalidFieldCases(validPayload, invalidCasesbyField),
                ...Object.values(ColumnType).map((type) => ({
                    title: `rejects invalid payload with type: ${type} upper case`,
                    payload: {
                        ...validPayload,
                        type: type.toUpperCase()
                    },
                    invalidField: 'type'
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'invalid_type' || result.error!.issues[0].code === 'invalid_format' || result.error!.issues[0].code === 'invalid_value');
                assert.deepStrictEqual(result.error!.issues[0].path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeColumnType>;
        }> = createMissingRequiredFieldCases(safeColumnSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnSchema.safeParse(testCase.payload);
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
            unrecognizedFields: Array<string>;
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField: 'unknown'
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'rejects unknown fields with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        unknownField: '  unknownField  '
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField1: 'unknownField1',
                        unknownField2: 'unknownField2'
                    },
                    unrecognizedFields: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const path = issues.path;
                assert.equal(code, 'unrecognized_keys');
                assert.deepStrictEqual(path, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
            })
        }
    });
});