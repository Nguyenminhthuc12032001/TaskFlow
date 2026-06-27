import { describe, it } from "node:test";
import { bulkRemoveBodySchema, type BulkRemoveBodyType } from "../../../../modules/task/task.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonUUIDValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: BulkRemoveBodyType = [
    {
        taskId: randomUUID()
    },
    {
        taskId: randomUUID()
    }
]

void describe('bulkRemoveBodySchema', () => {
    void it('accept valid payload', async () => {
        const result = bulkRemoveBodySchema.safeParse(validPayload);
        assert.ok(result.success);
        assert.deepEqual(result.data, validPayload);
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonArrayValues.filter((item) => item.value !== 'object').map((item) => ({
            title: `${item.label}`,
            payload: item.value
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = bulkRemoveBodySchema.safeParse(testCase.payload);

                assert.ok(!result.success);
                assert.equal(result.error.issues[0].code, 'invalid_type');
                assert.deepStrictEqual(result.error.issues[0].path, [])
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidElementCasesbyField: InvalidCasesByField<BulkRemoveBodyType[0]> = {
            taskId: invalidNonUUIDValues,
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload[0], invalidElementCasesbyField).map((testCase) => ({
            title: `rejects element: ${testCase.invalidField}`,
            payload: [testCase.payload],
            invalidField: testCase.invalidField
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = bulkRemoveBodySchema.safeParse(testCase.payload);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_format');
                assert.deepStrictEqual(issue.path[1], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[];
        }> = createMissingRequiredFieldCases(bulkRemoveBodySchema.element, validPayload[0]).map((testCase) => ({
            title: `${testCase.title}`,
            payload: [testCase.payload],
            missingFields: testCase.missingFields
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = bulkRemoveBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                const paths = result.error!.issues.map((issue) => issue.path[1]);
                assert.deepStrictEqual(paths, testCase.missingFields);
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
          title: string;
          payload: unknown;  
          unrecognizedFields: string[]
        }> = [
            {
                title: 'rejects unknown field',
                payload: [
                    {
                        taskId: randomUUID(),
                        unknownField: 'value'
                    }
                ],
                unrecognizedFields: ['unknownField']
            },
            {
                title: 'rejects multiple unknown fields',
                payload: [
                    {
                        taskId: randomUUID(),
                        unknownField1: 'value',
                        unknownField2: 'value'
                    }
                ],
                unrecognizedFields: ['unknownField1', 'unknownField2']
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = bulkRemoveBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                const paths = result.error!.issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(paths, [0]);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
            })
        }
    });
});