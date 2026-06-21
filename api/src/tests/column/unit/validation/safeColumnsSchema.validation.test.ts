import { describe, it } from "node:test";
import { safeColumnsSchema, type SafeColumnsType, type SafeColumnType } from "../../../../modules/column/column.schemas.js";
import { ColumnType } from "../../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonArrayValues, invalidNonBooleanValues, invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: SafeColumnsType = {
    data: [
        {
            id: randomUUID(),
            projectId: randomUUID(),
            name: 'Test Column',
            position: 1,
            type: ColumnType.todo,
            createdAt: new Date()
        },
        {
            id: randomUUID(),
            projectId: randomUUID(),
            name: 'Test Column',
            position: 2,
            type: ColumnType.todo,
            createdAt: new Date()
        }
    ],
    paginationMeta: {
        page: 1,
        limit: 10,
        totalItems: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    }
}

void describe('safeColumnsSchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: {
                data: unknown[],
                paginationMeta: unknown
            };
        }> = [
                {
                    title: 'valid normal payload',
                    payload: validPayload
                },
                {
                    title: 'valid payload with leading/trailing whitespace',
                    payload: {
                        data: validPayload.data.map(item => ({ ...item, name: `  ${item.name}  ` })),
                        paginationMeta: validPayload.paginationMeta
                    }
                },
                {
                    title: 'accept exact max length name',
                    payload: {
                        data: validPayload.data.map(item => ({ ...item, name: 'a'.repeat(100) })),
                        paginationMeta: validPayload.paginationMeta
                    }
                },
                {
                    title: 'accept min length name',
                    payload: {
                        data: validPayload.data.map(item => ({ ...item, name: 'a'.repeat(2) })),
                        paginationMeta: validPayload.paginationMeta
                    }
                },
                {
                    title: 'accept ISO date',
                    payload: {
                        data: validPayload.data.map(item => ({ ...item, createdAt: item.createdAt.toISOString() })),
                        paginationMeta: validPayload.paginationMeta
                    }
                },
                ...Object.values(ColumnType).map((type) => {
                    return {
                        title: `accept valid payload with type: ${type}`,
                        payload: {
                            data: validPayload.data.map(item => ({ ...item, type })),
                            paginationMeta: validPayload.paginationMeta
                        }
                    }
                })
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'valid payload with leading/trailing whitespace' || testCase.title === 'accept ISO date') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid payload fields', async (t) => {
        const invalidPayloadCasesByField: InvalidCasesByField<SafeColumnsType> = {
            data: invalidNonArrayValues,
            paginationMeta: invalidNonObjectValues.filter((test) => typeof test.value !== 'object')
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string,
        }> = createSingleInvalidFieldCases(validPayload, invalidPayloadCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'invalid_type' || result.error!.issues[0].code === 'invalid_format' || result.error!.issues[0].code === 'invalid_value');
                assert.deepStrictEqual(result.error!.issues[0].path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid data fields', async (t) => {
        const invalidDataCasesByField: InvalidCasesByField<SafeColumnType> = {
            id: invalidNonUUIDValues,
            projectId: invalidNonUUIDValues,
            name: invalidNonStringValues,
            position: invalidNonNumberValues,
            type: invalidNonStringValues,
            createdAt: invalidNonDateValues
        }

        const cases: Array<{
            title: string;
            payload: {
                data: unknown[],
                paginationMeta: SafeColumnsType['paginationMeta']
            };
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.data[0], invalidDataCasesByField).map((testCase) => {
            return {
                title: `rejects data: ${testCase.invalidField}`,
                payload: {
                    data: [testCase.payload],
                    paginationMeta: validPayload.paginationMeta
                },
                invalidField: testCase.invalidField
            }
        });

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'invalid_type' || result.error!.issues[0].code === 'invalid_format' || result.error!.issues[0].code === 'invalid_value');
                assert.deepStrictEqual(result.error!.issues[0].path[2], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid paginationMeta fields', async (t) => {
        const invalidPaginationMetaCasesByField: InvalidCasesByField<SafeColumnsType['paginationMeta']> = {
            page: invalidNonNumberValues,
            limit: invalidNonNumberValues,
            totalItems: invalidNonNumberValues,
            totalPages: invalidNonNumberValues,
            hasNextPage: invalidNonBooleanValues,
            hasPrevPage: invalidNonBooleanValues
        }

        const cases: Array<{
            title: string;
            payload: {
                data: SafeColumnsType['data'],
                paginationMeta: unknown
            };
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.paginationMeta, invalidPaginationMetaCasesByField).map((testCase) => {
            return {
                title: `rejects paginationMeta: ${testCase.invalidField}`,
                payload: {
                    data: validPayload.data,
                    paginationMeta: testCase.payload
                },
                invalidField: testCase.invalidField
            }
        });

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'invalid_type' || result.error!.issues[0].code === 'invalid_format' || result.error!.issues[0].code === 'invalid_value');
                assert.deepStrictEqual(result.error!.issues[0].path[1], testCase.invalidField);
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
                        data: validPayload.data.map(item => ({ ...item, name: 'a'.repeat(1) }))
                    }
                },
                {
                    title: 'rejects above max length name',
                    payload: {
                        ...validPayload,
                        data: validPayload.data.map(item => ({ ...item, name: 'a'.repeat(101) }))
                    }
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'too_small' || result.error!.issues[0].code === 'too_big');
                assert.deepStrictEqual(result.error!.issues[0].path[2], 'name');
            })
        }
    });

    void it('rejects upper case ColumnType', async (t) => {
        const cases: Array<{
            title: string;
            payload: {
                data: unknown[],
                paginationMeta: SafeColumnsType['paginationMeta']
            };
        }> = Object.values(ColumnType).map((type) => {
            return {
                title: `rejects ColumnType: ${type} with to upper case`,
                payload: {
                    data: validPayload.data.map(item => ({ ...item, type: type.toUpperCase() })),
                    paginationMeta: validPayload.paginationMeta
                }
            }
        })

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                assert.ok(result.error!.issues[0].code === 'invalid_value');
                assert.deepStrictEqual(result.error!.issues[0].path[0], 'data');
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeColumnsType>;
        }> = createMissingRequiredFieldCases(safeColumnsSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects missing data element fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: {
                data: unknown[],
                paginationMeta: SafeColumnsType['paginationMeta']
            };
            missingFields: Array<string>;
        }> = createMissingRequiredFieldCases(safeColumnsSchema.shape.data.element, validPayload.data[0]).map((testCase) => ({
            title: `rejects missing data: ${testCase.title}`,
            payload: {
                data: [testCase.payload],
                paginationMeta: validPayload.paginationMeta
            },
            missingFields: testCase.missingFields
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[2]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects missing paginationMeta required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: {
                data: SafeColumnsType['data'],
                paginationMeta: unknown
            };
            missingFields: Array<keyof SafeColumnsType['paginationMeta']>;
        }> = createMissingRequiredFieldCases(safeColumnsSchema.shape.paginationMeta, validPayload.paginationMeta).map((testCase) => ({
            title: `rejects missing paginationMeta: ${testCase.title}`,
            payload: {
                data: validPayload.data,
                paginationMeta: testCase.payload
            },
            missingFields: testCase.missingFields
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[1]);
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
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
            })
        }
    });

    void it('rejects data unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedFields: Array<string>;
        }> = [
            {
                title: 'rejects data unknown fields',
                payload: {
                    ...validPayload,
                    data: validPayload.data.map(item => ({ ...item, unknown: 'unknown' }))
                },
                unrecognizedFields: ['unknown']
            },
            {
                title: 'rejects data multiple unknown fields',
                payload: {
                    ...validPayload,
                    data: validPayload.data.map(item => ({ ...item, unknown: 'unknown', anotherUnknown: 'anotherUnknown' }))
                },
                unrecognizedFields: ['unknown', 'anotherUnknown']
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, ['data', 0]);
                if ('unrecognized_keys' in issues) {
                    assert.deepStrictEqual(issues.unrecognized_keys, testCase.unrecognizedFields);
                }
            })
        }
    });

    void it('rejects paginationMeta unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedFields: Array<string>;
        }> = [
            {
                title: 'rejects paginationMeta unknown fields',
                payload: {
                    ...validPayload,
                    paginationMeta: { ...validPayload.paginationMeta, unknown: 'unknown' }
                },
                unrecognizedFields: ['unknown']
            },
            {
                title: 'rejects paginationMeta multiple unknown fields',
                payload: {
                    ...validPayload,
                    paginationMeta: { ...validPayload.paginationMeta, unknown: 'unknown', anotherUnknown: 'anotherUnknown' }
                },
                unrecognizedFields: ['unknown', 'anotherUnknown']
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, ['paginationMeta']);
                if ('unrecognized_keys' in issues) {
                    assert.deepStrictEqual(issues.unrecognized_keys, testCase.unrecognizedFields);
                }
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
                    unknown: 'unknown'
                },
                unrecognizedFields: ['unknown']
            },
            {
                title: 'rejects multiple unknown fields',
                payload: {
                    ...validPayload,
                    unknown: 'unknown',
                    anotherUnknown: 'anotherUnknown'
                },
                unrecognizedFields: ['unknown', 'anotherUnknown']
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeColumnsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if ('unrecognized_keys' in issues) {
                    assert.deepStrictEqual(issues.unrecognized_keys, testCase.unrecognizedFields);
                }
            })
        }
    })
});