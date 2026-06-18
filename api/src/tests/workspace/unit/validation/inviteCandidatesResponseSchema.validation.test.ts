import { describe, it } from "node:test";
import { inviteCandidatesResponseSchema, type InviteCandidatesResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonBooleanValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, type InvalidCasesByField } from "../../../helper.js";

void describe("inviteCandidatesResponseSchema", () => {
    void it('accept valid payload', async (t) => {
        const validPayload: InviteCandidatesResponse = {
            data: [
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                },
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                }
            ],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        };

        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accepts normal payload',
                    payload: {
                        data: [
                            validPayload.data[0],
                        ],
                        paginationMeta: validPayload.paginationMeta
                    }
                },
                {
                    title: 'accepts valid payload with full data items',
                    payload: validPayload
                },
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteCandidatesResponseSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                assert.deepStrictEqual(result.data, testCase.payload);
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const validPayload: InviteCandidatesResponse = {
            data: [
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                },
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                }
            ],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        }

        const invalidCasesByField: InvalidCasesByField<InviteCandidatesResponse> = {
            data: invalidNonArrayValues,
            paginationMeta: invalidNonObjectValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField).map((testCase) => ({
            title: `rejects ${testCase.invalidField}`,
            payload: testCase.payload,
            invalidField: testCase.invalidField
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteCandidatesResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid data fields', async (t) => {
        const validPayload: InviteCandidatesResponse = {
            data: [
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                },
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                }
            ],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        }

        const invalidCasesByField: InvalidCasesByField<InviteCandidatesResponse['data'][0]> = {
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            email: invalidNonStringValues
        }

        const cases: Array<{
            title: string;
            payload: {
                data: unknown[],
                paginationMeta: InviteCandidatesResponse['paginationMeta'];
            };
            invalidField: string;
        }> = [
                ...createSingleInvalidFieldCases(validPayload.data[0], invalidCasesByField)
                    .map((testCase) => ({
                        title: `rejects ${testCase.invalidField}`,
                        payload: {
                            data: [testCase.payload],
                            paginationMeta: validPayload.paginationMeta
                        },
                        invalidField: testCase.invalidField
                    })),
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteCandidatesResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[2], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid paginationMeta fields', async (t) => {
        const validPayload: InviteCandidatesResponse = {
            data: [
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                },
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                }
            ],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        }

        const invalidCasesByField: InvalidCasesByField<InviteCandidatesResponse['paginationMeta']> = {
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
                data: InviteCandidatesResponse['data'];
                paginationMeta: unknown;
            };
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.paginationMeta, invalidCasesByField)
            .map((testCase) => ({
                title: `rejects ${testCase.invalidField}`,
                payload: {
                    data: validPayload.data,
                    paginationMeta: testCase.payload
                },
                invalidField: testCase.invalidField
            }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteCandidatesResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[1], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const validpayload: InviteCandidatesResponse = {
            data: [
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                },
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                }
            ],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<string>;
        }> = createMissingRequiredFieldCases(inviteCandidatesResponseSchema, validpayload).map((testCase) => ({
            title: `rejects ${testCase.missingFields.join(', ')}`,
            payload: testCase.payload,
            missingFields: testCase.missingFields
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteCandidatesResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects missing data fields', async (t) => {
        const validpayload: InviteCandidatesResponse = {
            data: [
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                },
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                }
            ],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        }

        const cases: Array<{
            title: string;
            payload: {
                data: unknown;
                paginationMeta: InviteCandidatesResponse['paginationMeta'];
            };
            missingFields: Array<string>;
        }> = createMissingRequiredFieldCases(inviteCandidatesResponseSchema.shape.data.element, validpayload.data[0]).map((testCase) => ({
            title: `rejects ${testCase.missingFields.join(', ')}`,
            payload: {
                data: [testCase.payload],
                paginationMeta: validpayload.paginationMeta
            },
            missingFields: testCase.missingFields
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteCandidatesResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[2]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects missing paginationMeta fields', async (t) => {
        const validpayload: InviteCandidatesResponse = {
            data: [
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                },
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                }
            ],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        }

        const cases: Array<{
            title: string;
            payload: {
                data: InviteCandidatesResponse['data'];
                paginationMeta: unknown;
            };
            missingFields: Array<string>;
        }> = createMissingRequiredFieldCases(inviteCandidatesResponseSchema.shape.paginationMeta, validpayload.paginationMeta).map((testCase) => ({
            title: `rejects ${testCase.missingFields.join(', ')}`,
            payload: {
                data: validpayload.data,
                paginationMeta: testCase.payload
            },
            missingFields: testCase.missingFields
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteCandidatesResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[1]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects unknown/multiple-unknown fields', async (t) => {
        const validPayload: InviteCandidatesResponse = {
            data: [
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                },
                {
                    id: `${randomUUID()}`,
                    name: 'name',
                    email: uniqueEmail(),
                }
            ],
            paginationMeta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown'
                    },
                    unrecognizedKeys: ['unknown']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    },
                    unrecognizedKeys: ['unknown1', 'unknown2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = inviteCandidatesResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.deepStrictEqual(issues.path, []);
                assert.ok(issues.code === 'unrecognized_keys');
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedKeys);
                }
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
                const result = inviteCandidatesResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    })
});