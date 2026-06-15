import { describe, it } from "node:test";
import { acceptBodySchema, type AcceptBody } from "../../../../modules/workspace/workspace.schemas.js";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

void describe('acceptBodySchema', () => {
    void it('accept valid payload', async () => {
        const payload: AcceptBody = {
            token: 'validToken',
        };

        const result = acceptBodySchema.safeParse(payload);
        assert.ok(result.success);
        assert.deepEqual(result.data, payload);
    });

    void it('rejects when missing required token', async () => {
        const payload: unknown = {};

        const result = acceptBodySchema.safeParse(payload);
        assert.equal(result.success, false);
    });

    void it('rejects non-string token', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonStringValues.map((test) => ({
                    title: `rejects invalid token ${test.label}`,
                    payload: {
                        token: test.value
                    }
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = acceptBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.deepStrictEqual(issues.path, ['token']);
            })
        }

    });

    void it('rejects when token is empty or only whitespace', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'rejects when token is empty',
                    payload: {
                        token: ''
                    }
                },
                {
                    title: 'rejects when token is only whitespace',
                    payload: {
                        token: '   '
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = acceptBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'too_small');
                assert.deepStrictEqual(issues.path, ['token']);
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
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = acceptBodySchema.safeParse(testCase.payload);
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
            unrecognizedKeys: Array<string>;
        }> = [
                {
                    title: 'rejects unknown fields',
                    payload: {
                        token: 'validToken',
                        unknown: 'unknown'
                    },
                    unrecognizedKeys: ['unknown']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        token: 'validToken',
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    },
                    unrecognizedKeys: ['unknown1', 'unknown2']
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = acceptBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'unrecognized_keys');
                assert.deepStrictEqual(issues.path, []);
                if (issues.code === 'unrecognized_keys') {
                    assert.deepStrictEqual(issues.keys, testCase.unrecognizedKeys);
                }
            })
        }
    });
});