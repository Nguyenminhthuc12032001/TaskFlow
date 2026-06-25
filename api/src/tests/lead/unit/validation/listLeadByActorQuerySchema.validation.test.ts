import { describe, it } from "node:test";
import { listLeadByActorQuerySchema, type ListLeadByActorQueryType } from "../../../../modules/lead/lead.schemas.js";
import { LeadStage } from "../../../../../prisma/generated/enums.js";
import { randomUUID } from "node:crypto";
import assert from "node:assert";
import { createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonDateValues, invalidNonNumberValues, invalidNonObjectValues, invalidNonStringValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: ListLeadByActorQueryType = {
    startDate: new Date(),
    endDate: new Date(),
    stage: LeadStage.new,
    workspaceId: randomUUID(),
    page: 1,
    limit: 10,
    search: 'test'
}

void describe('listLeadByActorQuerySchema', () => {
    void it('accept valid query', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'valid payload',
                    payload: validPayload
                },
                {
                    title: 'valid payload with ISO date string',
                    payload: {
                        ...validPayload,
                        startDate: validPayload.startDate!.toISOString(),
                        endDate: validPayload.endDate!.toISOString()
                    }
                },
                {
                    title: 'valid paylaod with leading/trailing whitespace search',
                    payload: {
                        ...validPayload,
                        search: `  ${validPayload.search}  `
                    }
                },
                {
                    title: 'accept empty payload',
                    payload: {}
                },
                {
                    title: 'accept exactly maximum content length payload',
                    payload: {
                        ...validPayload,
                        search: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept minimum content length payload',
                    payload: {
                        ...validPayload,
                        search: 'a'.repeat(5)
                    }
                },
                ...Object.values(LeadStage).map(stage => ({
                    title: `accept valid payload with stage: ${stage}`,
                    payload: {
                        ...validPayload,
                        stage
                    }
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listLeadByActorQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, true);
                if (testCase.title === 'valid paylaod with leading/trailing whitespace search' || testCase.title === 'valid payload with ISO date string') {
                    assert.deepStrictEqual(result.data, validPayload);
                }
                else {
                    assert.deepStrictEqual(result.data, testCase.payload);
                }
            })
        }
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<ListLeadByActorQueryType> = {
            startDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            endDate: invalidNonDateValues.filter((test) => test.value !== undefined),
            stage: invalidNonStringValues.filter((test) => test.value !== undefined),
            workspaceId: invalidNonUUIDValues.filter((test) => test.value !== undefined),
            page: invalidNonNumberValues.filter((test) => test.value !== undefined),
            limit: invalidNonNumberValues.filter((test) => test.value !== undefined),
            search: invalidNonStringValues.filter((test) => test.value !== undefined)
        }

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: keyof ListLeadByActorQueryType
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = listLeadByActorQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path[0], testCase.invalidField);
            })
        }
    });

    void it('rejects greater than max length of search', async () => {
        const result = listLeadByActorQuerySchema.safeParse({
            ...validPayload,
            search: 'a'.repeat(101)
        });
        assert.equal(result.success, false);
        const issues = result.error!.issues[0];
        assert.ok(issues.code === 'too_big');
        assert.deepStrictEqual(issues.path[0], 'search');
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
                const result = listLeadByActorQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
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
                const result = listLeadByActorQuerySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                const code = issues.code;
                assert.ok(code === 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedFields);
                }
            })
        }
    });
});