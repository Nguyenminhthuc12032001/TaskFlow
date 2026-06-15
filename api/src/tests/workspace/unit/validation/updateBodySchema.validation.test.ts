import { describe, it } from "node:test";
import { updateBodySchema, type UpdateWorkspaceBody } from "../../../../modules/workspace/workspace.schemas.js";
import assert from "node:assert";
import { invalidNonObjectValues, invalidNonStringValues } from "../../../validationTestValues.js";

void describe('updateBodySchema', () => {
    void it('accept valid payload', async (t) => {
        const payload: UpdateWorkspaceBody = {
            name: 'Test Workspace',
        };

        const cases: Array<{
            title: string;
            payload: UpdateWorkspaceBody;
        }> = [
                {
                    title: 'accept valid payload',
                    payload
                },
                {
                    title: 'accept valid name with exactly max length',
                    payload: {
                        name: 'a'.repeat(100)
                    }
                },
                {
                    title: 'accept valid name with exactly min length',
                    payload: {
                        name: 'a'.repeat(2)
                    }
                },
                {
                    title: 'accept valid name with leading/trailing whitespace',
                    payload: {
                        name: '  Test Workspace  '
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.ok(result.success);
                testCase.payload.name = testCase.payload.name.trim();
                assert.deepStrictEqual(result.data, testCase.payload);
            })
        }
    });

    void it('rejects invalid name length boundaries', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                {
                    title: 'rejects name length > 100',
                    payload: {
                        name: 'a'.repeat(101)
                    }
                },
                {
                    title: 'rejects name length < 2',
                    payload: {
                        name: 'a'.repeat(1)
                    }
                }
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.path[0], 'name');
                if (issues.code === 'too_big') {
                    assert.equal(issues.message, 'Name must be at most 100 characters long');
                } else if (issues.code === 'too_small') {
                    assert.equal(issues.message, 'Name must be at least 2 characters long');
                }
            });
        }
    });

    void it('rejects non-string name', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonStringValues.map((test) => ({
                    title: `rejects invalid name ${test.label}`,
                    payload: {
                        name: test.value
                    }
                }))
            ];

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
                assert.equal(issues.path[0], 'name');
            });
        }
    });

    void it('rejects invalid payload type', async (t) => {
        const cases: Array<{
            title: string;
            payload: unknown;
        }> = [
                ...invalidNonObjectValues.map((test) => ({
                    title: `rejects invalid payload type ${test.label}`,
                    payload: test.value
                }))
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
                assert.equal(result.success, false);
                const issues = result.error!.issues[0];
                assert.equal(issues.code, 'invalid_type');
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
                        name: 'Test Workspace',
                        unknown: 'unknown'
                    },
                    unrecognizedKeys: ['unknown']
                },
                {
                    title: 'rejects multiple unknown fields',
                    payload: {
                        name: 'Test Workspace',
                        unknown1: 'unknown1',
                        unknown2: 'unknown2'
                    },
                    unrecognizedKeys: ['unknown1', 'unknown2']
                }
            ]

        for (const testCase of cases) {
            await t.test(testCase.title, async () => {
                const result = updateBodySchema.safeParse(testCase.payload);
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