import { describe, it } from "node:test";
import { safeLeadsSchema, type SafeLeadsType } from "../../../../modules/lead/lead.schemas.js";
import { randomUUID } from "node:crypto";
import { LeadStage } from "../../../../../prisma/generated/enums.js";
import { createMissingRequiredFieldCases, createSingleInvalidFieldCases, uniqueEmail, uniquePhoneNumber, type InvalidCasesByField } from "../../../helper.js";
import assert from "node:assert";
import { invalidNonArrayValues, invalidNonObjectValues } from "../../../validationTestValues.js";

const validPayload: SafeLeadsType = {
    data: [
        {
            id: randomUUID(),
            workspaceId: randomUUID(),
            name: 'Test Lead',
            email: uniqueEmail(),
            phone: uniquePhoneNumber(),
            source: 'Test Source',
            stage: LeadStage.new,
            note: 'Test Note',
            createdBy: randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ],
    paginationMeta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    },
};

void describe('safeLeadDetailSchema', () => {
    void it('accepts valid payload', () => {
        const result = safeLeadsSchema.safeParse(validPayload);
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
            await t.test(testCase.title, () => {
                const result = safeLeadsSchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<SafeLeadsType> = {
            data: invalidNonArrayValues,
            paginationMeta: invalidNonObjectValues.filter((test) => typeof test.value !== 'object')
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = safeLeadsSchema.safeParse(testCase.payload);
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
            missingFields: Array<keyof SafeLeadsType>
        }> = createMissingRequiredFieldCases(safeLeadsSchema, validPayload);
        
        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await safeLeadsSchema.safeParseAsync(testCase.payload);
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
                const result = await safeLeadsSchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    })
});