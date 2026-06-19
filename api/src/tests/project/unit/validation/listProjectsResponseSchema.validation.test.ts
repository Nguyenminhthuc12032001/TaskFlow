import { describe, it } from "node:test";
import { listProjectsResponseSchema, type ListProjectResponseType } from "../../../../modules/project/project.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonArrayValues, invalidNonBooleanValues, invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";
import { isDeepStrictEqual } from "node:util";

const validPayload: ListProjectResponseType = {
    data: [
        {
            workspaceId: randomUUID(),
            id: randomUUID(),
            name: 'name',
            description: 'description',
            createdAt: new Date(),
            createdBy: randomUUID()
        },
        {
            workspaceId: randomUUID(),
            id: randomUUID(),
            name: 'name',
            description: 'description',
            createdAt: new Date(),
            createdBy: randomUUID()
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

void describe('listProjectsResponseSchema', () => {
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
                    title: 'accept name/description with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        data: validPayload.data.map((project) => ({
                            ...project,
                            name: `  ${project.name}  `,
                            description: `  ${project.description}  `
                        }))
                    }
                },
                {
                    title: 'accept name/description with exactly max length',
                    payload: {
                        ...validPayload,
                        data: validPayload.data.map((project) => ({
                            ...project,
                            name: 'a'.repeat(100),
                            description: 'a'.repeat(100)
                        }))
                    }
                },
                {
                    title: 'accept name/description with exactly min length',
                    payload: {
                        ...validPayload,
                        data: validPayload.data.map((project) => ({
                            ...project,
                            name: 'a'.repeat(2),
                            description: 'a'.repeat(10)
                        }))
                    }
                },
                {
                    title: 'accept ISO date string',
                    payload: {
                        ...validPayload,
                        data: validPayload.data.map((project) => ({
                            ...project,
                            createdAt: project.createdAt.toISOString()
                        }))
                    }
                },
            ]
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsResponseSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'accept name/description with leading/trailing whitespace' || testCase.title === 'accept ISO date string') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects misisng required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof ListProjectResponseType>;
        }> = createMissingRequiredFieldCases(listProjectsResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects missing data/paginationMeta required fields', async (t) => {
        const casesData: Array<{
            title: string;
            payload: {
                data: unknown;
                paginationMeta: ListProjectResponseType['paginationMeta'];
            };
            missingFields: Array<keyof ListProjectResponseType['data'][0]>;
        }> = createMissingRequiredFieldCases(listProjectsResponseSchema.shape.data.element, validPayload.data[0]).map((testCase) => ({
            title: `rejects missing data: ${testCase.title}`,
            payload: {
                data: [testCase.payload],
                paginationMeta: validPayload.paginationMeta
            },
            missingFields: testCase.missingFields
        }));

        const casesPaginationMeta: Array<{
            title: string;
            payload: {
                data: ListProjectResponseType['data'];
                paginationMeta: unknown;
            };
            missingFields: Array<keyof ListProjectResponseType['paginationMeta']>;
        }> = createMissingRequiredFieldCases(listProjectsResponseSchema.shape.paginationMeta, validPayload.paginationMeta).map((testCase) => ({
            title: `rejects missing paginationMeta: ${testCase.title}`,
            payload: {
                data: [validPayload.data[0]],
                paginationMeta: testCase.payload
            },
            missingFields: testCase.missingFields
        }));

        const cases = [...casesData, ...casesPaginationMeta];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                assert.ok(codes.some((code) => code === 'invalid_type'));
                assert.ok(
                    isDeepStrictEqual(
                        issues.map((issue) => issue.path),
                        testCase.missingFields.map((field) => ['data', 0, field])
                    )
                    ||
                    isDeepStrictEqual(
                        issues.map((issue) => issue.path),
                        testCase.missingFields.map((field) => ['paginationMeta', field])
                    )
                );
            })
        }
    })

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
                const result = listProjectsResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects invalid required fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<ListProjectResponseType> = {
            data: invalidNonArrayValues,
            paginationMeta: invalidNonObjectValues.filter((test) => typeof test.value !== 'object')
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_value');
                assert.deepStrictEqual(issue.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid data/paginationMeta required fields', async (t) => {
        const invalidDataCasesByField: InvalidCasesByField<ListProjectResponseType['data'][number]> = {
            workspaceId: invalidNonUUIDValues,
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            description: invalidNonStringValues.filter((test) => test.value !== undefined),
            createdAt: invalidNonDateValues,
            createdBy: invalidNonUUIDValues,
        }

        const invalidPaginationMetaCasesByField: InvalidCasesByField<ListProjectResponseType['paginationMeta']> = {
            page: invalidNonNumberValues,
            limit: invalidNonNumberValues,
            totalItems: invalidNonNumberValues,
            totalPages: invalidNonNumberValues,
            hasNextPage: invalidNonBooleanValues,
            hasPrevPage: invalidNonBooleanValues,
        }

        const dataCases: Array<{
            title: string;
            payload: {
                data: unknown;
                paginationMeta: ListProjectResponseType['paginationMeta'];
            };
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.data[0], invalidDataCasesByField).map((testCase) => ({
            title: `rejects data: ${testCase.invalidField}`,
            payload: {
                data: [testCase.payload],
                paginationMeta: validPayload.paginationMeta
            },
            invalidField: testCase.invalidField
        }));

        const paginationMetaCases: Array<{
            title: string;
            payload: {
                data: ListProjectResponseType['data'];
                paginationMeta: unknown;
            };
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.paginationMeta, invalidPaginationMetaCasesByField).map((testCase) => ({
            title: `rejects paginationMeta: ${testCase.invalidField}`,
            payload: {
                data: [validPayload.data[0]],
                paginationMeta: testCase.payload
            },
            invalidField: testCase.invalidField
        }));

        for (const testCase of [...dataCases, ...paginationMetaCases]) {
            await t.test(testCase.title, async () => {
                const result = listProjectsResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_value' || issue.code === 'invalid_format');
                assert.ok(issue.path[1] === testCase.invalidField || issue.path[2] === testCase.invalidField);
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
                    title: 'rejects unrecognized field',
                    payload: {
                        data: [validPayload.data[0]],
                        paginationMeta: validPayload.paginationMeta,
                        unknownField: 'unknownField'
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unrecognized fields',
                    payload: {
                        data: [validPayload.data[0]],
                        paginationMeta: validPayload.paginationMeta,
                        unknownField1: 'unknownField1',
                        unknownField2: 'unknownField2'
                    },
                    unrecognizedFields: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const paths = issues.path;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(paths, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
            })
        }
    });

    void it('rejects unknown data fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedFields: Array<string>;
        }> = [
                {
                    title: 'rejects unrecognized field',
                    payload: {
                        data: [{...validPayload.data[0], unknownField: 'unknownField' }],
                        paginationMeta: validPayload.paginationMeta
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unrecognized fields',
                    payload: {
                        data: [{...validPayload.data[0], unknownField1: 'unknownField1', unknownField2: 'unknownField2'}],
                        paginationMeta: validPayload.paginationMeta
                    },
                    unrecognizedFields: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const paths = issues.path;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(paths, ['data', 0]);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
            })
        }
    });

    void it('rejects unknown paginationMeta fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedFields: Array<string>;
        }> = [
                {
                    title: 'rejects unrecognized field',
                    payload: {
                        data: [validPayload.data[0]],
                        paginationMeta: { ...validPayload.paginationMeta, unknownField: 'unknownField' }
                    },
                    unrecognizedFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unrecognized fields',
                    payload: {
                        data: [validPayload.data[0]],
                        paginationMeta: { ...validPayload.paginationMeta, unknownField1: 'unknownField1', unknownField2: 'unknownField2' }
                    },
                    unrecognizedFields: ['unknownField1', 'unknownField2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listProjectsResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                const code = issues.code;
                const paths = issues.path;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(paths, ['paginationMeta']);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
            })
        }
    })
});