import { randomUUID } from "node:crypto";
import { safeAssigneeSchema, type SafeAssignee } from "../../../../modules/task/task.schemas.js";
import { describe, it } from "node:test";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonUUIDValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: SafeAssignee = {
    taskId: randomUUID(),
    userId: randomUUID(),
};

void describe('safeAssigneeSchema', () => {
    void it('accepts valid payload', () => {
        const result = safeAssigneeSchema.safeParse(validPayload);
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
                const result = await safeAssigneeSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    }); 

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeAssignee> = {
            taskId: invalidNonUUIDValues,
            userId: invalidNonUUIDValues,
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeAssigneeSchema.safeParseAsync(testCase.payload);
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
        }> = createMissingRequiredFieldCases(safeAssigneeSchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeAssigneeSchema.safeParseAsync(testCase.payload);
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
                const result = await safeAssigneeSchema.safeParseAsync(testCase.payload);
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