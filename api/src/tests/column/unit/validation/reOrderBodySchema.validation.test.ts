import { describe, it } from "node:test";
import { reOrderBodySchema, type ReOrderBodyType } from "../../../../modules/column/column.schemas.js";
import { randomInt, randomUUID } from "node:crypto";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonObjectValues } from "../../../validationTestValues.js";
import { createMissingRequiredFieldCases } from "../../../helper.js";

const validPayload: ReOrderBodyType = [
    {
        columnId: randomUUID(),
        position: 1
    },
    {
        columnId: randomUUID(),
        position: 5
    },
    {
        columnId: randomUUID(),
        position: 8
    }
]

void describe('reOrderBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'valid normal payload',
                    payload: validPayload
                },
                {
                    title: 'accept valid position',
                    payload: [{
                        ...validPayload[0],
                        position: randomInt(1, 100)
                    }]
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = reOrderBodySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                assert.deepEqual(result.data, testCase.payload);
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonObjectValues.filter((test) => typeof test.value !== 'object').map((test) => ({
                    title: `rejects invalid payload type ${test.label}`,
                    payload: test.value
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = reOrderBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
            })
        }
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof ReOrderBodyType[0]>;
        }> = createMissingRequiredFieldCases(reOrderBodySchema.element, validPayload[0]).map((testCase) => ({
            title: `${testCase.title}`,
            payload: [testCase.payload],
            missingFields: testCase.missingFields
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = reOrderBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                const paths = issues.map((issue) => issue.path[1]);
                assert.ok(codes.some((code) => code === 'invalid_type') || codes.some((code) => code === 'invalid_value'));
                assert.deepStrictEqual(paths.sort(), testCase.missingFields.sort());
            })
        }
    });

    void it('rejects unknown fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            unknownFields: Array<string>;
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: [{
                        ...validPayload[0],
                        unknown: 'unknown'
                    }],
                    unknownFields: ['unknown']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: [{
                        ...validPayload[0],
                        unknown: 'unknown',
                        anotherUnknown: 'anotherUnknown'
                    }],
                    unknownFields: ['unknown', 'anotherUnknown']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = reOrderBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                if (issues.code === 'unrecognized_keys') {
                    assert.deepEqual(issues.keys, testCase.unknownFields);
                }
            })
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = invalidNonArrayValues.filter((test) => typeof test.value !== 'object').map((test) => ({
            title: `rejects invalid payload type ${test.label}`,
            payload: test.value
        }))

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = reOrderBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
            })
        }
    });

    void it('rejects empty payload', async () => {
        const result = reOrderBodySchema.safeParse([]);
        assert.equal(result.success, false);
        const issues = result.error!.issues[0];
        assert.equal(issues.code, 'too_small');
    });
});