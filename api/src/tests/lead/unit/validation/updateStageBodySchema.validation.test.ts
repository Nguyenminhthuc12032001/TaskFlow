import { describe, it } from "node:test";
import { updateStageBodySchema, type UpdateStageBodyType } from "../../../../modules/lead/lead.schemas.js";
import { LeadStage } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";

const validPayload: UpdateStageBodyType = {
    stage: LeadStage.new
}

void describe('updateStageBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = Object.values(LeadStage).map(stage => ({
            title: `accept valid payload with stage: ${stage}`,
            payload: {
                ...validPayload,
                stage
            }
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = updateStageBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, true);
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
                const result = updateStageBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<UpdateStageBodyType> = {
            stage: invalidNonStringValues.filter((test) => test.value !== undefined)
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: keyof UpdateStageBodyType
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateStageBodySchema.safeParse(testCase.payload);
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
            missingFields: Array<keyof UpdateStageBodyType>
        }> = createMissingRequiredFieldCases(updateStageBodySchema, validPayload);
        
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateStageBodySchema.safeParse(testCase.payload);
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
            unrecognizedFields: Array<string>;
        }> = [
            {
                title: 'rejects unknown fields',
                payload: {
                    ...validPayload,
                    unknownField1: 'value1'
                },
                unrecognizedFields: ['unknownField1']
            },
            {
                title: 'rejects unknown fields',
                payload: {
                    ...validPayload,
                    unknownField1: 'value1',
                    unknownField2: 'value2'
                },
                unrecognizedFields: ['unknownField1', 'unknownField2']
            },
            {
                title: 'rejects multiple unknown fields',
                payload: {
                    ...validPayload,
                    unknownField1: 'value1',
                    unknownField2: 'value2',
                    unknownField3: 'value3'
                },
                unrecognizedFields: ['unknownField1', 'unknownField2', 'unknownField3']
            }
        ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateStageBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
            })
        }
    });
});