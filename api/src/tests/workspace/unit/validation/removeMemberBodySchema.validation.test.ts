import { describe, it } from "node:test";
import { removeMemberBodySchema } from "../../../../modules/workspace/workspace.schemas.js";
import assert from "node:assert";
import { invalidNonEmptyObjectValues } from "../../../validationTestValues.js";

void describe('removeMemberBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'accept empty payload',
                    payload: {}
                },
                {
                    title: 'accept undefined payload',
                    payload: undefined
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = removeMemberBodySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                assert.deepEqual(result.data, testCase.payload);
            })
        }
    });

    void it('rejects non-empty object', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonEmptyObjectValues.map((test) => ({
                    title: `rejects non-empty object ${test.label}`,
                    payload: test.value
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = removeMemberBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_union');
            })
        }
    }); 
});