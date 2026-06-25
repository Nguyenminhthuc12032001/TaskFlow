import { describe, it } from "node:test";
import { safeLeadDetailSchema, type SafeLeadDetailType } from "../../../../modules/lead/lead.schemas.js";
import { randomUUID } from "node:crypto";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, uniquePhoneNumber, type InvalidCasesByField } from "../../../helper.js";
import { LeadStage, TaskPriority } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const taskId = randomUUID();
const assigneeUserId = randomUUID();

const validPayload: SafeLeadDetailType = {
    id: randomUUID(),
    workspaceId: randomUUID(),
    name: 'Test Lead',
    email: uniqueEmail(),
    phone: uniquePhoneNumber(),
    source: 'Test Source',
    stage: LeadStage.new,
    note: 'Test Note',
    createdBy: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLinks: [
        {
            id: taskId,
            projectId: randomUUID(),
            columnId: randomUUID(),
            title: 'Test Task',
            description: 'Test task description',
            priority: TaskPriority.low,
            dueDate: new Date(),
            position: 0,
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            assignees: [
                {
                    taskId,
                    userId: assigneeUserId,
                },
            ],
        },
    ],
};

void describe('safeLeadDetailSchema', () => {
    void it('accepts valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accepts valid normal payload',
                    payload: validPayload
                },
                {
                    title: 'accepts valid payload with ISO date string',
                    payload: {
                        ...validPayload,
                        createdAt: validPayload.createdAt.toISOString(),
                        updatedAt: validPayload.updatedAt.toISOString()
                    }
                },
                {
                    title: 'accepts valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `,
                        note: `  ${validPayload.note}  `,
                        source: `  ${validPayload.source}  `,
                    }
                },
                {
                    title: 'accepts email/phone/source undefined payload',
                    payload: {
                        ...validPayload,
                        email: undefined,
                        phone: undefined,
                        source: undefined
                    }
                },
                {
                    title: 'accepts maximum name, note, source length payload',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100),
                        note: 'a'.repeat(200),
                        source: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accepts minimum name, note, source length payload',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(5),
                        note: 'a'.repeat(5),
                        source: 'a'.repeat(10)
                    }
                },
            ]

        for (const { title, payload } of cases) {
            await t.test(title, async () => {
                const result = safeLeadDetailSchema.safeParse(payload);
                assert.equal(result.success, true);
                if (title === 'accepts valid payload with leading/trailing whitespace' || title === 'accepts valid payload with ISO date string') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, payload);
                }
            });
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeLeadDetailType> = {
            id: invalidNonUUIDValues,
            workspaceId: invalidNonUUIDValues,
            name: invalidNonStringValues,
            email: invalidNonStringValues.filter((test) => test.value !== undefined),
            phone: invalidNonStringValues.filter((test) => test.value !== undefined),
            source: invalidNonStringValues.filter((test) => test.value !== undefined),
            stage: invalidNonStringValues.filter((test) => test.value !== undefined),
            note: invalidNonStringValues,
            createdBy: invalidNonUUIDValues,
            createdAt: invalidNonDateValues.filter((test) => test.value !== undefined),
            updatedAt: invalidNonDateValues.filter((test) => test.value !== undefined),
            taskLinks: invalidNonArrayValues,
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeLeadDetailSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects greater than max/min length', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidFields: string[];
        }> = [
                {
                    title: 'rejects name below min length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(4),
                    },
                    invalidFields: ['name'],
                },
                {
                    title: 'rejects name above max length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(101),
                    },
                    invalidFields: ['name'],
                },
                {
                    title: 'rejects source below min length',
                    payload: {
                        ...validPayload,
                        source: 'a'.repeat(9),
                    },
                    invalidFields: ['source'],
                },
                {
                    title: 'rejects source above max length',
                    payload: {
                        ...validPayload,
                        source: 'a'.repeat(101),
                    },
                    invalidFields: ['source'],
                },
                {
                    title: 'rejects note below min length',
                    payload: {
                        ...validPayload,
                        note: 'a'.repeat(4),
                    },
                    invalidFields: ['note'],
                },
                {
                    title: 'rejects note above max length',
                    payload: {
                        ...validPayload,
                        note: 'a'.repeat(201),
                    },
                    invalidFields: ['note'],
                },
            ];

            for (const { title, payload, invalidFields } of cases) {
                await t.test(title, async () => {
                    const result = await safeLeadDetailSchema.safeParseAsync(payload);
                    assert.equal(result.success, false);
                    assert.deepStrictEqual(result.error!.issues.map((issue) => issue.path[0]), invalidFields);
                });
            }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeLeadDetailType>
        }> = createMissingRequiredFieldCases(safeLeadDetailSchema, validPayload);
        
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeLeadDetailSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                assert.ok(codes.every((code) => code === 'invalid_type' || code === 'invalid_format' || code === 'invalid_value'));
                const paths = issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(paths, testCase.missingFields);
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unknownFields: Array<string>
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
                const result = await safeLeadDetailSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unknownFields);
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
                const result = await safeLeadDetailSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});