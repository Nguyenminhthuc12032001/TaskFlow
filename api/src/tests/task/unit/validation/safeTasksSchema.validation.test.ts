import { randomUUID } from "node:crypto";
import { safeTasksSchema, type SafeTasks } from "../../../../modules/task/task.schemas.js";
import { TaskPriority } from "../../../../../prisma/generated/enums.js";
import { describe, it } from "node:test";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonObjectValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const taskId1 = randomUUID();
const taskId2 = randomUUID();

const validPayload: SafeTasks = {
    data: [
        {
            id: taskId1,
            projectId: randomUUID(),
            columnId: randomUUID(),
            title: 'Test Task One',
            description: 'Test task one description',
            priority: TaskPriority.low,
            dueDate: new Date(),
            position: 0,
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            assignees: [
                {
                    taskId: taskId1,
                    userId: randomUUID(),
                },
            ],
        },
        {
            id: taskId2,
            projectId: randomUUID(),
            columnId: randomUUID(),
            title: 'Test Task Two',
            description: 'Test task two description',
            priority: TaskPriority.medium,
            dueDate: new Date(),
            position: 1,
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            assignees: [
                {
                    taskId: taskId2,
                    userId: randomUUID(),
                },
            ],
        },
    ],
    paginationMeta: {
        page: 1,
        limit: 10,
        totalItems: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    },
};

void describe('safeTasksSchema', () => {
    void it('accepts valid payload', async (t) => {
        const cases: Array<{
          title: string;
          payload: unknown;  
        }> = [
            {
                title: 'accepts valid payload',
                payload: validPayload
            },
            {
                title: 'accepts valid payload with only one element',
                payload: {
                    ...validPayload,
                    data: [validPayload.data[0]]
                }
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = safeTasksSchema.safeParse(testCase.payload);
                assert.ok(result.success);
                assert.deepStrictEqual(result.data, testCase.payload);
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
                const result = await safeTasksSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeTasks> = {
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
                const result = await safeTasksSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path, [testCase.invalidField]);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[];
        }> = createMissingRequiredFieldCases(safeTasksSchema, validPayload);
        
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeTasksSchema.safeParseAsync(testCase.payload);
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
                const result = await safeTasksSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unknownFields);
                }
            })
        }
    })
});