import { describe, it } from "node:test";
import { listTaskByColumnQuerySchema, type ListTaskByColumnQueryType } from "../../../../modules/task/task.schemas.js";
import { TaskPriority } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: ListTaskByColumnQueryType = {
    page: 1,
    limit: 10,
    dueDateRange: {
        startDate: new Date(),
        endDate: new Date()
    },
    priority: TaskPriority.low,
    startDate: new Date(),
    endDate: new Date(),
    search: 'test'
}

void describe('listTaskByColumnQuerySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
            {
                title: 'accept normal payload',
                payload: validPayload
            },
            {
                title: 'accept ISO string',
                payload: {
                    ...validPayload,
                    dueDateRange: {
                        ...validPayload.dueDateRange,
                        startDate: validPayload.dueDateRange!.startDate!.toISOString(),
                        endDate: validPayload.dueDateRange!.endDate!.toISOString()
                    },
                    startDate: validPayload.startDate!.toISOString(),
                    endDate: validPayload.endDate!.toISOString()
                }
            },
            {
                title: 'accept leading/trailing whitespace search',
                payload: {
                    ...validPayload,
                    search: ` ${validPayload.search} `
                }
            },
            {
                title: 'accept empty payload',
                payload: {}
            },
            {
                title: 'accept maximum content length payload',
                payload: {
                    ...validPayload,
                    search: 'a'.repeat(100)
                }
            },
            ...Object.values(TaskPriority).map(priority => ({
                title: `accept priority ${priority}`,
                payload: {
                    ...validPayload,
                    priority
                }
            }))
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await listTaskByColumnQuerySchema.safeParseAsync(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'accept ISO string' || testCase.title === 'accept leading/trailing whitespace search') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<ListTaskByColumnQueryType> = {
            page: invalidNonNumberValues.filter((test) => test.value !== undefined),
            limit: invalidNonNumberValues.filter((test) => test.value !== undefined),
            dueDateRange: invalidNonObjectValues.filter((test) => test.value !== undefined && typeof test.value !== 'object'),
            priority: invalidNonStringValues.filter((test) => test.value !== undefined),
            startDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            endDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            search: invalidNonStringValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await listTaskByColumnQuerySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[];
        }> = createMissingRequiredFieldCases(listTaskByColumnQuerySchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await listTaskByColumnQuerySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, testCase.missingFields);
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
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await listTaskByColumnQuerySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});