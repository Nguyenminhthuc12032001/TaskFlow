import { describe, it } from "node:test";
import { safeLeadSchema, type SafeLeadType } from "../../../../modules/lead/lead.schemas.js";
import { randomUUID } from "node:crypto";
import { LeadStage } from "../../../../../prisma/generated/enums.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, uniquePhoneNumber, type InvalidCasesByField } from "../../../helper.js";
import assert from "node:assert";
import { invalidNonDateValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: SafeLeadType = {
    id: randomUUID(),
    workspaceId: randomUUID(),
    name: 'Test Lead',
    stage: LeadStage.new,
    note: 'Test Note',
    email: uniqueEmail(),
    phone: uniquePhoneNumber(),
    source: 'Test Source',
    createdBy: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
}

void describe('safeLeadSchema', () => {
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
                    title: 'accepts valid payload with ISO date string',
                    payload: {
                        ...validPayload,
                        createdAt: validPayload.createdAt.toISOString(),
                        updatedAt: validPayload.updatedAt.toISOString()
                    }
                },
                {
                    title: 'accepts valid payload with leading/trailing whitespace',
                    payload: {
                        ...validPayload,
                        name: `  ${validPayload.name}  `,
                        note: `  ${validPayload.note}  `,
                        source: `  ${validPayload.source}  `,
                    }
                },
                {
                    title: 'accepts email/phone/source undefined payload',
                    payload: {
                        ...validPayload,
                        email: undefined,
                        phone: undefined,
                        source: undefined
                    }
                },
                {
                    title: 'accepts maximum name, note, source length payload',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(100),
                        note: 'a'.repeat(200),
                        source: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accepts minimum name, note, source length payload',
                    payload: {
                        ...validPayload,
                        name: 'a'.repeat(5),
                        note: 'a'.repeat(5),
                        source: 'a'.repeat(10)
                    }
                },
                ...Object.values(LeadStage).map((stage) => ({
                    title: `accepts ${stage} stage payload`,
                    payload: {
                        ...validPayload,
                        stage
                    }
                }))
            ];
        for (const { title, payload } of cases) {
            await t.test(title, () => {
                const result = safeLeadSchema.safeParse(payload);
                assert.equal(result.success, true);
                if (title === 'accepts valid payload with leading/trailing whitespace' || title === 'accepts valid payload with ISO date string') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, payload);
                }
            });
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeLeadType> = {
            id: invalidNonUUIDValues,
            name: invalidNonStringValues,
            workspaceId: invalidNonUUIDValues,
            stage: invalidNonStringValues,
            note: invalidNonStringValues,
            email: invalidNonStringValues.filter((test) => test.value !== undefined),
            phone: invalidNonStringValues.filter((test) => test.value !== undefined),
            source: invalidNonStringValues.filter((test) => test.value !== undefined),
            createdBy: invalidNonUUIDValues,
            createdAt: invalidNonDateValues,
            updatedAt: invalidNonDateValues,
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeLeadSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects greater than maximum name/note/source length', async () => {
        const invalidPayload: SafeLeadType = {
            ...validPayload,
            name: 'a'.repeat(101),
            note: 'a'.repeat(201),
            source: 'a'.repeat(101)
        }

        const result = await safeLeadSchema.safeParseAsync(invalidPayload);
        assert.equal(result.success, false);
        const issues = result.error!.issues;
        const codes = issues.map((issue) => issue.code);
        assert.ok(codes.every((code) => code === 'too_big'));
    });
    
    void it('rejects less than minimum name/note/source length', async () => {
        const invalidPayload: SafeLeadType = {
            ...validPayload,
            name: 'a'.repeat(4),
            note: 'a'.repeat(4),
            source: 'a'.repeat(10)
        }

        const result = await safeLeadSchema.safeParseAsync(invalidPayload);
        assert.equal(result.success, false);
        const issues = result.error!.issues;
        const codes = issues.map((issue) => issue.code);
        assert.ok(codes.every((code) => code === 'too_small'));
    });

    void it('rejects missing required fields', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
            missingFields: Array<keyof SafeLeadType>
        }> = createMissingRequiredFieldCases(safeLeadSchema, validPayload);
        
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeLeadSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues;
                const codes = issues.map((issue) => issue.code);
                assert.ok(codes.every((code) => code === 'invalid_type' || code === 'invalid_format' || code === 'invalid_value'));
                const paths = issues.map((issue) => issue.path[0]);
                assert.deepStrictEqual(paths, testCase.missingFields);
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
                const result = await safeLeadSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
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
                const result = await safeLeadSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unknownFields);
                }
            })
        }
    });
});