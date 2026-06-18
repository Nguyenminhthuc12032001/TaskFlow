import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, type InvalidCasesByField } from "../../../helper.js";
import { membersResponseSchema, type SafeMembersResponse } from "../../../../modules/workspace/workspace.schemas.js";
import { WorkspaceRole } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonBooleanValues, invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

void describe('membersResponseSchema', () => {
    void it('accept valid payload', async () => {
        const payload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
                },
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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
                    title: 'accept normal payload',
                    payload
                },
                {
                    title: 'accept valid payload date ISO string',
                    payload: {
                        ...payload,
                        data: payload.data.map((member) => {
                            return {
                                ...member,
                                joinedAt: member.joinedAt.toISOString()
                            }
                        })
                    }
                },
                {
                    title: 'accept valid payload with 1 data item',
                    payload: {
                        data: [
                            {
                                user: payload.data[0].user,
                                role: payload.data[0].role,
                                joinedAt: payload.data[0].joinedAt
                            }
                        ],
                        paginationMeta: payload.paginationMeta
                    }
                }
            ]

        for (const testCase of cases) {
            const result = await membersResponseSchema.safeParseAsync(testCase.payload);
            assert.ok(result.success);
            if (testCase.title === 'accept valid payload date ISO string') {
                assert.deepStrictEqual(result.data, payload);
            }
            else {
                assert.deepStrictEqual(result.data, testCase.payload);
            }
        }
    });

    void it('rejects missing required fields', async (t) => {
        const validPayload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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
            missingFields: Array<keyof SafeMembersResponse>;
        }> = createMissingRequiredFieldCases(membersResponseSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects missing data required fields', async (t) => {
        const validPayload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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
                data: unknown[],
                paginationMeta: SafeMembersResponse['paginationMeta'];
            };
            missingFields: Array<string>;
        }> = createMissingRequiredFieldCases(membersResponseSchema.shape.data.element, validPayload.data[0]).map((testCase) => ({
            title: `rejects missing required data: ${testCase.title}`,
            payload: {
                ...validPayload,
                data: [testCase.payload],
            },
            missingFields: testCase.missingFields
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[2]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects missing user fields', async (t) => {
        const validPayload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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
                data: {
                    user: unknown;
                    role: WorkspaceRole;
                    joinedAt: Date;
                }[],
                paginationMeta: SafeMembersResponse['paginationMeta'];
            };
            missingFields: Array<string>;
        }> = createMissingRequiredFieldCases(membersResponseSchema.shape.data.element.shape.user, validPayload.data[0].user).map((testCase) => ({
            title: `rejects missing required user: ${testCase.title}`,
            payload: {
                ...validPayload,
                data: [{
                    ...validPayload.data[0],
                    user: testCase.payload
                }]
            },
            missingFields: testCase.missingFields
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[3]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects missing paginationMeta fields', async (t) => {
        const validPayload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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
                data: SafeMembersResponse['data'];
                paginationMeta: unknown;
            };
            missingFields: Array<string>;
        }> = createMissingRequiredFieldCases(membersResponseSchema.shape.paginationMeta, validPayload.paginationMeta).map((testCase) => ({
            title: `rejects missing required paginationMeta: ${testCase.title}`,
            payload: {
                ...validPayload,
                paginationMeta: testCase.payload
            },
            missingFields: testCase.missingFields
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[1]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const validPayload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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

        const invalidCasesByField: InvalidCasesByField<SafeMembersResponse> = {
            data: invalidNonArrayValues,
            paginationMeta: invalidNonObjectValues
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField).map((testCase) => ({
            title: `rejects invalid fields: ${testCase.title}`,
            payload: testCase.payload,
            invalidField: testCase.invalidField
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid data fields', async (t) => {
        const validPayload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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

        const invalidCasesByField: InvalidCasesByField<SafeMembersResponse['data'][0]> = {
            user: invalidNonObjectValues,
            role: invalidNonStringValues,
            joinedAt: invalidNonDateValues
        }

        const cases: Array<{
            title: string;
            payload: {
                data: unknown;
                paginationMeta: SafeMembersResponse['paginationMeta'];
            };
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.data[0], invalidCasesByField).map((testCase) => ({
            title: `rejects invalid data fields: ${testCase.title}`,
            payload: {
                ...validPayload,
                data: [testCase.payload]
            },
            invalidField: testCase.invalidField
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[2], testCase.invalidField);
            })
        }
    })

    void it('rejects invalid user fields', async (t) => {
        const validPayload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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

        const invalidCasesByField: InvalidCasesByField<SafeMembersResponse['data'][0]['user']> = {
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            email: invalidNonStringValues
        }

        const cases: Array<{
            title: string;
            payload: {
                data: {
                    user: unknown;
                    role: WorkspaceRole;
                    joinedAt: Date;
                }[];
                paginationMeta: SafeMembersResponse['paginationMeta'];
            },
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.data[0].user, invalidCasesByField).map((testCase) => ({
            title: `rejects invalid user fields: ${testCase.title}`,
            payload: {
                ...validPayload,
                data: [
                    {
                        ...validPayload.data[0],
                        user: testCase.payload
                    }
                ]
            },
            invalidField: testCase.invalidField
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[3], testCase.invalidField);
            })
        }
    });

    void it('rejects invalid paginationMeta fields', async (t) => {
        const validPayload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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

        const invalidCasesByField: InvalidCasesByField<SafeMembersResponse['paginationMeta']> = {
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
                data: SafeMembersResponse['data'];
                paginationMeta: unknown;
            };
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.paginationMeta, invalidCasesByField).map((testCase) => ({
            title: `rejects invalid paginationMeta fields: ${testCase.title}`,
            payload: {
                ...validPayload,
                paginationMeta: testCase.payload
            },
            invalidField: testCase.invalidField
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[1], testCase.invalidField);
            })
        }
    });

    void it('rejects unknowm fields', async (t) => {
        const validPayload: SafeMembersResponse = {
            data: [
                {
                    user: {
                        id: `${randomUUID()}`,
                        name: 'Test User',
                        email: uniqueEmail(),
                    },
                    role: WorkspaceRole.member,
                    joinedAt: new Date()
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
                data: {
                    user: {
                        id: string;
                        name: string;
                        email: string;
                        [key: string]: unknown;
                    };
                    role: WorkspaceRole;
                    joinedAt: Date;
                    [key: string]: unknown;
                }[];
                paginationMeta: {
                    page: number;
                    limit: number;
                    totalItems: number;
                    totalPages: number;
                    hasNextPage: boolean;
                    hasPrevPage: boolean;
                    [key: string]: unknown;
                };
                [key: string]: unknown;
            };
            unrecognizedKeys: Array<string>;
            expectedPath: Array<string | number>;
        }> = [
                {
                    title: 'rejects normal unknown fields',
                    payload: {
                        ...validPayload,
                        unknown: 'unknown',
                        unknown2: 'unknown2'
                    },
                    unrecognizedKeys: ['unknown', 'unknown2'],
                    expectedPath: []
                },
                {
                    title: 'rejects unknown fields in data',
                    payload: {
                        ...validPayload,
                        data: [
                            {
                                ...validPayload.data[0],
                                unknown: 'unknown'
                            }
                        ]
                    },
                    unrecognizedKeys: ['unknown'],
                    expectedPath: ['data', 0]
                },
                {
                    title: 'rejects unknown fields in paginationMeta',
                    payload: {
                        ...validPayload,
                        paginationMeta: {
                            ...validPayload.paginationMeta,
                            unknown: 'unknown'
                        }
                    },
                    unrecognizedKeys: ['unknown'],
                    expectedPath: ['paginationMeta']
                },
                {
                    title: 'rejects unknowm fields in data.user',
                    payload: {
                        ...validPayload,
                        data: [
                            {
                                ...validPayload.data[0],
                                user: {
                                    ...validPayload.data[0].user,
                                    unknown: 'unknown'
                                }
                            }
                        ]
                    },
                    unrecognizedKeys: ['unknown'],
                    expectedPath: ['data', 0, 'user']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, testCase.expectedPath);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });

    void it('rejects invalid payload types', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
            title: `rejects invalid payload type ${test.label}`,
            payload: test.value
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = membersResponseSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});
