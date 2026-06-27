import { randomUUID } from "node:crypto";
import { assignBodySchema, type AssignBodyType } from "../../../../modules/task/task.schemas.js";
import { describe, it } from "node:test";
import assert from "node:assert";
import { createSingleInvalidFieldCases, type InvalidCasesByField } from "../../../helper.js";
import { invalidNonObjectValues, invalidNonUUIDValues } from "../../../validationTestValues.js";

const validPayload: AssignBodyType = {
    userId: randomUUID()
}

void describe('assignBodySchema', () => {
    void it('accept valid payload', async () => {
        const result = assignBodySchema.safeParse(validPayload);
        assert.ok(result.success);
        assert.deepEqual(result.data, validPayload);
    });

    void it('rejects invalid fields', async (t) => {
        const invalidCasesByField: InvalidCasesByField<AssignBodyType> = {
            userId: invalidNonUUIDValues
        } 

        const cases: Array<{
            title: string;
            payload: unknown;
            invalidField: string;
        }> = createSingleInvalidFieldCases(validPayload, invalidCasesByField);

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await assignBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.ok(issues.code === 'invalid_type' || issues.code === 'invalid_format' || issues.code === 'invalid_value');
                assert.deepStrictEqual(issues.path, [testCase.invalidField]);
            })
        }
    });

    void it('rejects missing required fields', async () => {
        const result = await assignBodySchema.safeParseAsync({});
        assert.equal(result.success, false);
        const issues = result.error!.issues[0];
        assert.equal(issues.code, 'invalid_type');
        assert.deepStrictEqual(issues.path, ['userId']);
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
                const result = await assignBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unknownFields);
                }
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
        }));

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = await assignBodySchema.safeParseAsync(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, []);
            })
        }
    });
});