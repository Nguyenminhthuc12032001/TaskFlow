import { describe, it } from "node:test";
import { safeTaskSchema, type SafeTask } from "../../../../modules/task/task.schemas.js";
import { randomUUID } from "node:crypto";
import { TaskPriority } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonDateValues, invalidNonEnumValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const taskId = randomUUID();

const validPayload: SafeTask = {
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
            userId: randomUUID(),
        },
    ],
};

void describe('safeTaskSchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accepts valid payload',
                    payload: validPayload
                },
                {
                    title: 'accepts valid payload with no assignees/dueDate/position/description',
                    payload: {
                        ...validPayload,
                        assignees: [],
                        dueDate: undefined,
                        position: undefined,
                        description: undefined
                    }
                },
                {
                    title: 'accepts valid payload with ISO date string',
                    payload: {
                        ...validPayload,
                        createdAt: validPayload.createdAt.toISOString(),
                        updatedAt: validPayload.updatedAt.toISOString(),
                        dueDate: validPayload.dueDate!.toISOString()
                    }
                },
                {
                    title: 'accepts valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        title: `  ${validPayload.title}  `,
                        description: `  ${validPayload.description}  `,
                    }
                },
                {
                    title: 'accepts valid payload with minimum length fields',
                    payload: {
                        ...validPayload,
                        title: 'a'.repeat(5),
                        description: 'a'.repeat(10),
                    }
                },
                {
                    title: 'accepts valid payload with maximum length fields',
                    payload: {
                        ...validPayload,
                        title: 'a'.repeat(100),
                        description: 'a'.repeat(100),
                    }
                },
                ...Object.values(TaskPriority).map(priority => ({
                    title: `accepts valid payload with priority ${priority}`,
                    payload: {
                        ...validPayload,
                        priority
                    }
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = safeTaskSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'accepts valid payload with leading/trailing whitespace' || testCase.title === 'accepts valid payload with ISO date string') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
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
                const result = await safeTaskSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects greater than max length of fields', async () => {
        const result = safeTaskSchema.safeParse({
            ...validPayload,
            title: 'a'.repeat(101),
            description: 'a'.repeat(101),
        });
        assert.equal(result.success, false);
        const issues = result.error!.issues;
        const codes = issues.map((issue) => issue.code);
        const paths = issues.map((issue) => issue.path[0]);
        assert.deepStrictEqual(codes.every((code) => code === 'too_big'), true);
        assert.deepStrictEqual(paths.sort(), ['title', 'description'].sort());
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeTask> = {
            id: invalidNonUUIDValues,
            projectId: invalidNonUUIDValues,
            columnId: invalidNonUUIDValues,
            title: invalidNonStringValues,
            description: invalidNonStringValues.filter((test) => test.value !== undefined),
            priority: invalidNonEnumValues,
            dueDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            position: invalidNonNumberValues.filter((test) => test.value !== undefined),
            createdBy: invalidNonUUIDValues,
            createdAt: invalidNonDateValues,
            updatedAt: invalidNonDateValues,
            assignees: invalidNonArrayValues.filter((test) => test.value !== undefined),
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeTaskSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path, [testCase.invalidField]);
            })
        }
    });

    void it('rejects invalid assignee fields', async (t) => {
        const invalidAssigneeCasesByField: InvalidCasesByField<NonNullable<SafeTask['assignees']>[number]> = {
            taskId: invalidNonUUIDValues,
            userId: invalidNonUUIDValues,
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload.assignees![0], invalidAssigneeCasesByField).map((testCase) => ({
            title: `rejects assignee: ${testCase.invalidField}`,
            payload: {
                ...validPayload,
                assignees: [testCase.payload]
            },
            invalidField: testCase.invalidField
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeTaskSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[2], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[];
        }> = createMissingRequiredFieldCases(safeTaskSchema, validPayload);
        
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeTaskSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(codes.every((code) => code === 'invalid_type' || code === 'invalid_format' || code === 'invalid_value'), true);
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unknownFields: string[];
        }> = [
            {
                title: 'rejects unknown fields',
                payload: {
                    ...validPayload,
                    foo: 'bar'
                },
                unknownFields: ['foo']
            },
            {
                title: 'rejects unknown fields',
                payload: {
                    ...validPayload,
                    foo: 'bar',
                    bar: 'baz'
                },
                unknownFields: ['foo', 'bar']
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeTaskSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unknownFields);
                }
            })
        }
    });
});