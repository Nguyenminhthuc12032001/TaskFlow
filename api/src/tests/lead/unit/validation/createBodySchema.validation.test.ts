import { describe, it } from "node:test";
import { createBodySchema, type CreateBodyType } from "../../../../modules/lead/lead.schemas.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, uniquePhoneNumber, type InvalidCasesByField } from "../../../helper.js";
import { LeadStage } from "../../../../../prisma/generated/enums.js";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

const validPayload: CreateBodyType = {
    name: 'Test Lead',
    note: 'Test Note',
    email: uniqueEmail(),
    phone: uniquePhoneNumber(),
    source: 'Test Source',
    stage: LeadStage.new
}

void describe('createBodySchema', () => {
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
                    title: 'accepts valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `,
                        email: `  ${validPayload.email}  `,
                        phone: `  ${validPayload.phone}  `,
                        source: `  ${validPayload.source}  `,
                        note: `  ${validPayload.note}  `
                    }
                },
                {
                    title: 'accepts email, phone, source, stage undefined',
                    payload: {
                        ...validPayload,
                        email: undefined,
                        phone: undefined,
                        source: undefined,
                        stage: undefined
                    }
                },
                {
                    title: 'accepts maximum name, note, source length',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100),
                        source: 'a'.repeat(100),
                        note: 'a'.repeat(200)
                    }
                },
                ...Object.values(LeadStage).map(stage => ({
                    title: `accept valid payload with stage: ${stage}`,
                    payload: {
                        ...validPayload,
                        stage
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await createBodySchema.safeParseAsync(testCase.payload);
                assert.ok(result.success);
                if (testCase.title === 'accepts valid payload with leading/trailing whitespace') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<CreateBodyType> = {
            name: invalidNonStringValues,
            note: invalidNonStringValues,
            email: invalidNonStringValues.filter((test) => test.value !== undefined),
            phone: invalidNonStringValues.filter((test) => test.value !== undefined),
            source: invalidNonStringValues.filter((test) => test.value !== undefined),
            stage: invalidNonStringValues.filter((test) => test.value !== undefined)
        };

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: keyof CreateBodyType
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await createBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects when length name/source/note greater than maximum', async () => {
        const invalidPayload: CreateBodyType = {
            ...validPayload,
            name: 'a'.repeat(101),
            source: 'a'.repeat(101),
            note: 'a'.repeat(201)
        }

        const result = await createBodySchema.safeParseAsync(invalidPayload);
        assert.equal(result.success, false);
        const issues = result.error!.issues;
        const codes = issues.map((issue) => issue.code);
        assert.ok(codes.every((code) => code === 'too_big'));
    });

    void it('rejects when length name/source/note less than minimum', async () => {
        const invalidPayload: CreateBodyType = {
            ...validPayload,
            name: 'a'.repeat(4),
            source: 'a'.repeat(9),
            note: 'a'.repeat(4)
        }

        const result = await createBodySchema.safeParseAsync(invalidPayload);
        assert.equal(result.success, false);
        const issues = result.error!.issues;
        const codes = issues.map((issue) => issue.code);
        assert.ok(codes.every((code) => code === 'too_small'));
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
                const result = await createBodySchema.safeParseAsync(testCase.payload);
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
            missingFields: Array<keyof CreateBodyType>
        }> = createMissingRequiredFieldCases(createBodySchema, validPayload);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await createBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                assert.ok(codes.every((code) => code === 'invalid_type' || code === 'invalid_format'));
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
                    title: 'rejects unknown field',
                    payload: {
                        ...validPayload,
                        unknownField: 'unknown'
                    },
                    unknownFields: ['unknownField']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        ...validPayload,
                        unknownField1: 'unknown',
                        unknownField2: 'unknown'
                    },
                    unknownFields: ['unknownField1', 'unknownField2']
                }
            ]

            for (const testCase of cases) {
                await t.test(testCase.title, async () => {
                    const result = await createBodySchema.safeParseAsync(testCase.payload);
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