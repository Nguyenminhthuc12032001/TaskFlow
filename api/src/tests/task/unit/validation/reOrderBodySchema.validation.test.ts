import { describe, it } from "node:test";
import { reOrderBodySchema, type ReOrderBodyType } from "../../../../modules/task/task.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonNumberValues, invalidNonUUIDValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases } from "../../../helper.js";

const validPayload: ReOrderBodyType = [
    {
        taskId: randomUUID(),
        position: 0
    },
    {
        taskId: randomUUID(),
        position: 1
    }
]

void describe('reOrderBodySchema', () => {
    void it('accept valid payload', async () => {
        const result = reOrderBodySchema.safeParse(validPayload);
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
                const result = reOrderBodySchema.safeParse(testCase.payload);

                assert.ok(!result.success);
                assert.equal(result.error.issues[0].code, 'invalid_type');
                assert.deepStrictEqual(result.error.issues[0].path, [])
            })
        }
    });

    void it('rejects missing required fields', async () => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[];
        }> = createMissingRequiredFieldCases(reOrderBodySchema.element, validPayload[0]);

        for (const testCase of cases) {
            await it(testCase.title, async () => {
                const result = await reOrderBodySchema.safeParseAsync([testCase.payload]);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                const paths = result.error!.issues.map((issue) => issue.path[1]);
                assert.deepStrictEqual(paths, testCase.missingFields);
            })
        }
    });

    void it('rejects invalid element fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload[0], {
            taskId: invalidNonUUIDValues,
            position: invalidNonNumberValues
        })

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = reOrderBodySchema.safeParse([testCase.payload]);
                assert.ok(!result.success);
                const issue = result.error!.issues[0];
                assert.ok(issue.code === 'invalid_type' || issue.code === 'invalid_format');
                assert.deepStrictEqual(issue.path[1], testCase.invalidField);
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: [
                {
                    taskId: string;
                    position: number;
                    [key: string]: unknown
                }
            ];
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: [
                        {
                            ...validPayload[0],
                            foo: 'bar'
                        }
                    ],
                    unrecognizedKeys: ['foo']
                },
                {
                    title: 'rejects unknown fields',
                    payload: [
                        {
                            ...validPayload[0],
                            foo: 'bar',
                            bar: 'baz'
                        }
                    ],
                    unrecognizedKeys: ['foo', 'bar']
                }
            ]
            
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await reOrderBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, [0]);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });
});