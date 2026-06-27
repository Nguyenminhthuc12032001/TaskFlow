import { describe, it } from "node:test";
import { safeAssigneeDetailSchema, type SafeTaskDetailAssignee } from "../../../../modules/task/task.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonObjectValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases } from "../../../helper.js";

const validPayload: SafeTaskDetailAssignee = {
    taskId: randomUUID(),
    userId: randomUUID(),
    user: {
        id: randomUUID(),
        name: 'John Doe',
        email: 'jdoe@me.com',
    },
}

void describe('safeAssigneeDetailSchema', () => {
    void it('accepts valid payload', async () => {
        const result = await safeAssigneeDetailSchema.safeParseAsync(validPayload);
        assert.ok(result.success);
        assert.deepStrictEqual(result.data, validPayload);
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
                const result = await safeAssigneeDetailSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: string[];
        }> = createMissingRequiredFieldCases(safeAssigneeDetailSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeAssigneeDetailSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                const paths = result.error!.issues.map((issue) => issue.path[0]);
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
                const result = await safeAssigneeDetailSchema.safeParseAsync(testCase.payload);
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