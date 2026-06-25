import { describe, it } from "node:test";
import { safeLeadTaskLinkSchema, type SafeLeadTaskLinkType } from "../../../../modules/lead/lead.schemas.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonUUIDValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: SafeLeadTaskLinkType = {
    leadId: randomUUID(),
    taskId: randomUUID()
}

void describe('safeLeadDetailSchema', () => {
    void it('accepts valid payload', async () => {
        const result = safeLeadTaskLinkSchema.safeParse(validPayload);
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
                const result = safeLeadTaskLinkSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeLeadTaskLinkType> = {
            leadId: invalidNonUUIDValues,
            taskId: invalidNonUUIDValues,
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeLeadTaskLinkSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeLeadTaskLinkType>
        }> = createMissingRequiredFieldCases(safeLeadTaskLinkSchema, validPayload);
        
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeLeadTaskLinkSchema.safeParseAsync(testCase.payload);
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
                const result = await safeLeadTaskLinkSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unknownFields);
                }
            })
        }
    })
});