export type InvalidValueCase = {
    label: string;
    value: unknown;
};

class CustomClass { }

const normalFunction = function (): void { };
const asyncFunction = async function (): Promise<void> { };
const generatorFunction = function* (): Generator<void> { };

export const invalidNonStringValues: Array<InvalidValueCase> = [
    // =========================
    // 1. Absence values
    // =========================
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },

    // =========================
    // 2. Number values
    // =========================
    { label: 'number: positive integer', value: 1 },
    { label: 'number: zero', value: 0 },
    { label: 'number: negative integer', value: -1 },
    { label: 'number: decimal', value: 1.5 },
    { label: 'number: NaN', value: Number.NaN },
    { label: 'number: Infinity', value: Number.POSITIVE_INFINITY },
    { label: 'number: -Infinity', value: Number.NEGATIVE_INFINITY },

    // =========================
    // 3. Boolean values
    // =========================
    { label: 'boolean: true', value: true },
    { label: 'boolean: false', value: false },

    // =========================
    // 4. BigInt values
    // =========================
    { label: 'bigint: zero', value: BigInt(0) },
    { label: 'bigint: positive', value: BigInt(1) },
    { label: 'bigint: negative', value: BigInt(-1) },

    // =========================
    // 5. Symbol values
    // =========================
    { label: 'symbol: empty', value: Symbol() },
    { label: 'symbol: with description', value: Symbol('test') },

    // =========================
    // 6. Plain object values
    // =========================
    { label: 'object: empty object', value: {} },
    { label: 'object: object with properties', value: { name: 'Test User' } },
    { label: 'object: null prototype object', value: Object.create(null) },

    // =========================
    // 7. Array values
    // =========================
    { label: 'array: empty array', value: [] },
    { label: 'array: string array', value: ['abc'] },
    { label: 'array: number array', value: [1, 2, 3] },
    { label: 'array: mixed array', value: ['abc', 123, true] },

    // =========================
    // 8. Built-in object values
    // =========================
    { label: 'date', value: new Date('2026-01-01T00:00:00.000Z') },
    { label: 'regexp', value: /abc/ },
    { label: 'error', value: new Error('Test error') },
    { label: 'map', value: new Map() },
    { label: 'set', value: new Set() },
    { label: 'weak map', value: new WeakMap() },
    { label: 'weak set', value: new WeakSet() },
    { label: 'array buffer', value: new ArrayBuffer(8) },
    { label: 'uint8 array', value: new Uint8Array([1, 2, 3]) },

    // =========================
    // 9. Boxed primitive values
    // These look like primitive values,
    // but their typeof is "object".
    // =========================
    { label: 'boxed string', value: new String('abc') },
    { label: 'boxed empty string', value: new String('') },
    { label: 'boxed number', value: new Number(1) },
    { label: 'boxed boolean true', value: new Boolean(true) },
    { label: 'boxed boolean false', value: new Boolean(false) },
    { label: 'boxed bigint', value: Object(BigInt(1)) },
    { label: 'boxed symbol', value: Object(Symbol('test')) },

    // =========================
    // 10. Function values
    // =========================
    { label: 'function: arrow function', value: () => { } },
    { label: 'function: normal function', value: normalFunction },
    { label: 'function: async function', value: asyncFunction },
    { label: 'function: generator function', value: generatorFunction },

    // =========================
    // 11. Class values
    // =========================
    { label: 'class constructor', value: CustomClass },
    { label: 'class instance', value: new CustomClass() },
];

// Use this only for schemas that expect a number.
export const invalidNonNumberValues: Array<InvalidValueCase> = [
    // =========================
    // 1. Absence values
    // =========================
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },

    // =========================
    // 2. String values
    // =========================
    { label: 'string: empty string', value: '' },
    { label: 'string: normal string', value: 'abc' },
    { label: 'string: decimal numeric string', value: '12.5' },
    { label: 'string: negative numeric string', value: '-1' },
    { label: 'string: whitespace', value: '   ' },
    { label: 'string: boolean-like string', value: 'true' },
    { label: 'string: json-like string', value: '{"value":123}' },

    // =========================
    // 3. Boolean values
    // =========================
    { label: 'boolean: true', value: true },
    { label: 'boolean: false', value: false },

    // =========================
    // 4. BigInt values
    // =========================
    { label: 'bigint: zero', value: BigInt(0) },
    { label: 'bigint: positive', value: BigInt(1) },
    { label: 'bigint: negative', value: BigInt(-1) },

    // =========================
    // 5. Symbol values
    // =========================
    { label: 'symbol: empty', value: Symbol() },
    { label: 'symbol: with description', value: Symbol('test') },

    // =========================
    // 6. Plain object values
    // =========================
    { label: 'object: empty object', value: {} },
    { label: 'object: object with number property', value: { value: 123 } },
    { label: 'object: null prototype object', value: Object.create(null) },

    // =========================
    // 7. Array values
    // =========================
    { label: 'array: empty array', value: [] },
    { label: 'array: number array', value: [1, 2, 3] },
    { label: 'array: single number array', value: [1] },
    { label: 'array: string number array', value: ['123'] },
    { label: 'array: mixed array', value: [1, '2', true] },

    // =========================
    // 8. Built-in object values
    // =========================
    { label: 'date', value: new Date('2026-01-01T00:00:00.000Z') },
    { label: 'regexp', value: /123/ },
    { label: 'error', value: new Error('Test error') },
    { label: 'map', value: new Map() },
    { label: 'set', value: new Set() },
    { label: 'weak map', value: new WeakMap() },
    { label: 'weak set', value: new WeakSet() },
    { label: 'array buffer', value: new ArrayBuffer(8) },
    { label: 'uint8 array', value: new Uint8Array([1, 2, 3]) },

    // =========================
    // 9. Boxed primitive values
    // These look close to primitive values,
    // but their typeof is "object".
    // =========================
    { label: 'boxed number', value: new Number(123) },
    { label: 'boxed zero', value: new Number(0) },
    { label: 'boxed string number', value: new String('123') },
    { label: 'boxed boolean true', value: new Boolean(true) },
    { label: 'boxed boolean false', value: new Boolean(false) },
    { label: 'boxed bigint', value: Object(BigInt(1)) },
    { label: 'boxed symbol', value: Object(Symbol('test')) },

    // =========================
    // 10. Function values
    // =========================
    { label: 'function: arrow function', value: () => { } },
    { label: 'function: normal function', value: normalFunction },
    { label: 'function: async function', value: asyncFunction },
    { label: 'function: generator function', value: generatorFunction },

    // =========================
    // 11. Class values
    // =========================
    { label: 'class constructor', value: CustomClass },
    { label: 'class instance', value: new CustomClass() },

    // =========================
    // 12. Other values
    // =========================
    { label: 'number: NaN', value: Number.NaN },
    { label: 'number: Infinity', value: Number.POSITIVE_INFINITY },
    { label: 'number: -Infinity', value: Number.NEGATIVE_INFINITY },
];

// Use this only for schemas that expect a plain object payload.
export const invalidNonObjectValues: Array<InvalidValueCase> = [
    // =========================
    // 1. Absence values
    // =========================
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },

    // =========================
    // 2. String values
    // =========================
    { label: 'string: empty string', value: '' },
    { label: 'string: normal string', value: 'abc' },
    { label: 'string: numeric string', value: '123' },
    { label: 'string: whitespace', value: '   ' },
    { label: 'string: json-like object string', value: '{"name":"Test User"}' },
    { label: 'string: array-like string', value: '[1,2,3]' },

    // =========================
    // 3. Number values
    // =========================
    { label: 'number: positive integer', value: 1 },
    { label: 'number: zero', value: 0 },
    { label: 'number: negative integer', value: -1 },
    { label: 'number: decimal', value: 1.5 },
    { label: 'number: NaN', value: Number.NaN },
    { label: 'number: Infinity', value: Number.POSITIVE_INFINITY },
    { label: 'number: -Infinity', value: Number.NEGATIVE_INFINITY },

    // =========================
    // 4. Boolean values
    // =========================
    { label: 'boolean: true', value: true },
    { label: 'boolean: false', value: false },

    // =========================
    // 5. BigInt values
    // =========================
    { label: 'bigint: zero', value: BigInt(0) },
    { label: 'bigint: positive', value: BigInt(1) },
    { label: 'bigint: negative', value: BigInt(-1) },

    // =========================
    // 6. Symbol values
    // =========================
    { label: 'symbol: empty', value: Symbol() },
    { label: 'symbol: with description', value: Symbol('test') },

    // =========================
    // 7. Array values
    // Arrays are typeof "object",
    // but they are not plain object payloads.
    // =========================
    { label: 'array: empty array', value: [] },
    { label: 'array: string array', value: ['abc'] },
    { label: 'array: number array', value: [1, 2, 3] },
    { label: 'array: object array', value: [{ name: 'Test User' }] },
    { label: 'array: mixed array', value: ['abc', 123, true, null] },

    // =========================
    // 8. Built-in object values
    // These are objects, but not plain objects.
    // =========================
    { label: 'date', value: new Date('2026-01-01T00:00:00.000Z') },
    { label: 'regexp', value: /abc/ },

    { label: 'map: empty map', value: new Map() },
    { label: 'map: with entries', value: new Map([['key', 'value']]) },

    { label: 'set: empty set', value: new Set() },
    { label: 'set: with values', value: new Set([1, 2, 3]) },

    { label: 'weak map', value: new WeakMap() },
    { label: 'weak set', value: new WeakSet() },

    { label: 'array buffer', value: new ArrayBuffer(8) },
    { label: 'data view', value: new DataView(new ArrayBuffer(8)) },

    { label: 'int8 array', value: new Int8Array([1, 2, 3]) },
    { label: 'uint8 array', value: new Uint8Array([1, 2, 3]) },
    { label: 'uint16 array', value: new Uint16Array([1, 2, 3]) },
    { label: 'uint32 array', value: new Uint32Array([1, 2, 3]) },
    { label: 'float32 array', value: new Float32Array([1.1, 2.2, 3.3]) },
    { label: 'float64 array', value: new Float64Array([1.1, 2.2, 3.3]) },

    { label: 'url', value: new URL('https://example.com') },
    { label: 'url search params', value: new URLSearchParams('a=1&b=2') },

    // =========================
    // 9. Boxed primitive values
    // These look close to primitive values,
    // but their typeof is "object".
    // =========================
    { label: 'boxed string', value: new String('abc') },
    { label: 'boxed empty string', value: new String('') },

    { label: 'boxed number', value: new Number(123) },
    { label: 'boxed zero', value: new Number(0) },
    { label: 'boxed NaN', value: new Number(Number.NaN) },
    { label: 'boxed Infinity', value: new Number(Number.POSITIVE_INFINITY) },

    { label: 'boxed boolean true', value: new Boolean(true) },
    { label: 'boxed boolean false', value: new Boolean(false) },

    { label: 'boxed bigint', value: Object(BigInt(1)) },
    { label: 'boxed symbol', value: Object(Symbol('test')) },

    // =========================
    // 10. Function values
    // =========================
    { label: 'function: arrow function', value: () => { } },
    { label: 'function: normal function', value: normalFunction },
    { label: 'function: async function', value: asyncFunction },
    { label: 'function: generator function', value: generatorFunction },

    // =========================
    // 11. Class values
    // =========================
    { label: 'class constructor', value: CustomClass },
    { label: 'class instance', value: new CustomClass() },
];

// Use this only for schemas that expect a valid Date object.
export const invalidNonDateValues: Array<InvalidValueCase> = [
    // =========================
    // 1. Absence values
    // =========================
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },

    // =========================
    // 2. String values
    // These may look like dates,
    // but they are still strings.
    // =========================
    { label: 'string: empty string', value: '' },
    { label: 'string: normal string', value: 'abc' },
    { label: 'string: whitespace', value: '   ' },
    { label: 'string: timestamp string', value: '1767225600000' },
    { label: 'string: invalid date string', value: 'not-a-date' },

    // =========================
    // 3. Number values
    // Timestamps are numbers,
    // but they are not Date objects.
    // =========================
    { label: 'number: positive integer timestamp', value: 1767225600000 },
    { label: 'number: zero timestamp', value: 0 },
    { label: 'number: negative timestamp', value: -1 },
    { label: 'number: decimal', value: 1.5 },
    { label: 'number: NaN', value: Number.NaN },
    { label: 'number: Infinity', value: Number.POSITIVE_INFINITY },
    { label: 'number: -Infinity', value: Number.NEGATIVE_INFINITY },

    // =========================
    // 4. Boolean values
    // =========================
    { label: 'boolean: true', value: true },
    { label: 'boolean: false', value: false },

    // =========================
    // 5. BigInt values
    // =========================
    { label: 'bigint: zero', value: BigInt(0) },
    { label: 'bigint: positive', value: BigInt(1) },
    { label: 'bigint: negative', value: BigInt(-1) },

    // =========================
    // 6. Symbol values
    // =========================
    { label: 'symbol: empty', value: Symbol() },
    { label: 'symbol: with description', value: Symbol('test') },

    // =========================
    // 7. Plain object values
    // =========================
    { label: 'object: empty object', value: {} },
    { label: 'object: object with date property', value: { date: '2026-01-01' } },
    { label: 'object: object with timestamp property', value: { timestamp: 1767225600000 } },
    { label: 'object: null prototype object', value: Object.create(null) },

    // =========================
    // 8. Array values
    // =========================
    { label: 'array: empty array', value: [] },
    { label: 'array: date string array', value: ['2026-01-01'] },
    { label: 'array: timestamp array', value: [1767225600000] },
    { label: 'array: mixed array', value: ['2026-01-01', 1767225600000, true] },

    // =========================
    // 9. Invalid Date values
    // These are Date instances,
    // but they do not represent valid dates.
    // =========================
    { label: 'date: invalid date from string', value: new Date('invalid-date') },
    { label: 'date: invalid date from NaN', value: new Date(Number.NaN) },
    { label: 'date: invalid date from Infinity', value: new Date(Number.POSITIVE_INFINITY) },
    { label: 'date: invalid date from -Infinity', value: new Date(Number.NEGATIVE_INFINITY) },

    // =========================
    // 10. Built-in object values
    // =========================
    { label: 'regexp', value: /2026/ },
    { label: 'error', value: new Error('Test error') },
    { label: 'map', value: new Map() },
    { label: 'set', value: new Set() },
    { label: 'weak map', value: new WeakMap() },
    { label: 'weak set', value: new WeakSet() },
    { label: 'array buffer', value: new ArrayBuffer(8) },
    { label: 'uint8 array', value: new Uint8Array([1, 2, 3]) },
    { label: 'url', value: new URL('https://example.com') },
    { label: 'url search params', value: new URLSearchParams('date=2026-01-01') },

    // =========================
    // 11. Boxed primitive values
    // These look close to primitive values,
    // but their typeof is "object".
    // =========================
    { label: 'boxed string date', value: new String('2026-01-01') },
    { label: 'boxed empty string', value: new String('') },
    { label: 'boxed number timestamp', value: new Number(1767225600000) },
    { label: 'boxed zero', value: new Number(0) },
    { label: 'boxed boolean true', value: new Boolean(true) },
    { label: 'boxed boolean false', value: new Boolean(false) },
    { label: 'boxed bigint', value: Object(BigInt(1)) },
    { label: 'boxed symbol', value: Object(Symbol('test')) },

    // =========================
    // 12. Function values
    // =========================
    { label: 'function: arrow function', value: () => { } },
    { label: 'function: normal function', value: normalFunction },
    { label: 'function: async function', value: asyncFunction },
    { label: 'function: generator function', value: generatorFunction },

    // =========================
    // 13. Class values
    // =========================
    { label: 'class constructor', value: CustomClass },
    { label: 'class instance', value: new CustomClass() },
];

// Use this only for schemas that expect a valid UUID string.
export const invalidNonUUIDValues: Array<InvalidValueCase> = [
    // =========================
    // 1. Absence values
    // =========================
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },

    // =========================
    // 2. Non-string primitive values
    // =========================
    { label: 'number: positive integer', value: 1 },
    { label: 'number: zero', value: 0 },
    { label: 'number: negative integer', value: -1 },
    { label: 'number: decimal', value: 1.5 },
    { label: 'number: NaN', value: Number.NaN },
    { label: 'number: Infinity', value: Number.POSITIVE_INFINITY },
    { label: 'number: -Infinity', value: Number.NEGATIVE_INFINITY },

    { label: 'boolean: true', value: true },
    { label: 'boolean: false', value: false },

    { label: 'bigint: zero', value: BigInt(0) },
    { label: 'bigint: positive', value: BigInt(1) },
    { label: 'bigint: negative', value: BigInt(-1) },

    { label: 'symbol: empty', value: Symbol() },
    { label: 'symbol: with description', value: Symbol('test') },

    // =========================
    // 3. Invalid UUID string values
    // =========================
    { label: 'string: empty string', value: '' },
    { label: 'string: whitespace', value: '   ' },
    { label: 'string: normal string', value: 'abc' },
    { label: 'string: numeric string', value: '123' },
    { label: 'string: boolean-like string', value: 'true' },
    { label: 'string: json-like string', value: '{"id":"test"}' },

    { label: 'uuid: too short', value: '123e4567-e89b-12d3-a456' },
    { label: 'uuid: too long', value: '123e4567-e89b-12d3-a456-426614174000-extra' },
    { label: 'uuid: missing hyphens', value: '123e4567e89b12d3a456426614174000' },
    { label: 'uuid: wrong hyphen positions', value: '123e456-7e89-b12d-3a45-6426614174000' },
    { label: 'uuid: invalid character', value: '123e4567-e89b-12d3-a456-42661417400z' },
    { label: 'uuid: incomplete group', value: '123e4567-e89b-12d3-a456-42661417400' },
    { label: 'uuid: extra group', value: '123e4567-e89b-12d3-a456-426614174000-1111' },
    { label: 'uuid: no version', value: '123e4567-e89b-x2d3-a456-426614174000' },
    { label: 'uuid: invalid variant', value: '123e4567-e89b-12d3-z456-426614174000' },
    { label: 'uuid: surrounded by spaces', value: ' 123e4567-e89b-12d3-a456-426614174000 ' },

    // =========================
    // 4. Plain object values
    // =========================
    { label: 'object: empty object', value: {} },
    { label: 'object: object with id property', value: { id: '123e4567-e89b-12d3-a456-426614174000' } },
    { label: 'object: null prototype object', value: Object.create(null) },

    // =========================
    // 5. Array values
    // =========================
    { label: 'array: empty array', value: [] },
    { label: 'array: uuid string array', value: ['123e4567-e89b-12d3-a456-426614174000'] },
    { label: 'array: mixed array', value: ['abc', 123, true] },

    // =========================
    // 6. Built-in object values
    // =========================
    { label: 'date', value: new Date('2026-01-01T00:00:00.000Z') },
    { label: 'regexp', value: /uuid/ },
    { label: 'error', value: new Error('Test error') },
    { label: 'map', value: new Map() },
    { label: 'set', value: new Set() },
    { label: 'weak map', value: new WeakMap() },
    { label: 'weak set', value: new WeakSet() },
    { label: 'array buffer', value: new ArrayBuffer(8) },
    { label: 'uint8 array', value: new Uint8Array([1, 2, 3]) },
    { label: 'url', value: new URL('https://example.com') },
    { label: 'url search params', value: new URLSearchParams('id=123') },

    // =========================
    // 7. Boxed primitive values
    // =========================
    { label: 'boxed string uuid', value: new String('123e4567-e89b-12d3-a456-426614174000') },
    { label: 'boxed empty string', value: new String('') },
    { label: 'boxed number', value: new Number(1) },
    { label: 'boxed boolean true', value: new Boolean(true) },
    { label: 'boxed boolean false', value: new Boolean(false) },
    { label: 'boxed bigint', value: Object(BigInt(1)) },
    { label: 'boxed symbol', value: Object(Symbol('test')) },

    // =========================
    // 8. Function values
    // =========================
    { label: 'function: arrow function', value: () => { } },
    { label: 'function: normal function', value: normalFunction },
    { label: 'function: async function', value: asyncFunction },
    { label: 'function: generator function', value: generatorFunction },

    // =========================
    // 9. Class values
    // =========================
    { label: 'class constructor', value: CustomClass },
    { label: 'class instance', value: new CustomClass() },
];
export const invalidNonEnumValues: Array<InvalidValueCase> = [
    // =========================
    // 1. Empty / whitespace strings
    // =========================
    { label: 'string: empty string', value: '' },
    { label: 'string: whitespace', value: '   ' },

    // =========================
    // 2. Generic invalid enum strings
    // =========================
    { label: 'string: invalid enum value', value: '__INVALID_ENUM_VALUE__' },
    { label: 'string: unknown enum value', value: '__UNKNOWN_ENUM_VALUE__' },

    // =========================
    // 3. Case-sensitive mistakes
    // =========================
    { label: 'string: uppercase value', value: 'INVALID_ENUM_VALUE' },
    { label: 'string: mixed-case value', value: 'InvalidEnumValue' },

    // =========================
    // 4. Spacing mistakes
    // =========================
    { label: 'string: value with leading space', value: ' __INVALID_ENUM_VALUE__' },
    { label: 'string: value with trailing space', value: '__INVALID_ENUM_VALUE__ ' },

    // =========================
    // 5. Format-like strings
    // =========================
    { label: 'string: numeric string', value: '123' },
    { label: 'string: boolean-like string', value: 'true' },
    { label: 'string: json-like string', value: '{"value":"__INVALID_ENUM_VALUE__"}' },
    ...invalidNonStringValues,
];

export const invalidNonEmptyObjectValues: Array<InvalidValueCase> = [
    // =========================
    // 1. Simple non-empty objects
    // =========================
    { label: 'object: one property', value: { key: 'value' } },
    { label: 'object: multiple properties', value: { key1: 'value1', key2: 'value2' } },

    // =========================
    // 2. Common request body-like objects
    // =========================
    { label: 'object: userId property', value: { userId: 'test-user-id' } },
    { label: 'object: role property', value: { role: 'member' } },
    { label: 'object: id property', value: { id: 'test-id' } },
    { label: 'object: name property', value: { name: 'Test User' } },

    // =========================
    // 3. Objects with different value types
    // =========================
    { label: 'object: string property', value: { value: 'test' } },
    { label: 'object: number property', value: { value: 1 } },
    { label: 'object: boolean property', value: { value: true } },
    { label: 'object: null property', value: { value: null } },
    { label: 'object: undefined property', value: { value: undefined } },

    // =========================
    // 4. Nested object / array properties
    // =========================
    { label: 'object: nested object property', value: { data: { key: 'value' } } },
    { label: 'object: empty nested object property', value: { data: {} } },
    { label: 'object: empty array property', value: { items: [] } },
    { label: 'object: array property', value: { items: [1, 2, 3] } },

    // =========================
    // 5. Null-prototype non-empty object
    // =========================
    {
        label: 'object: null prototype with property',
        value: Object.assign(Object.create(null), { key: 'value' })
    },
];

export const invalidNonBooleanValues: Array<InvalidValueCase> = [
    // =========================
    // 1. Absence values
    // =========================
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },

    // =========================
    // 2. String values
    // =========================
    { label: 'string: empty string', value: '' },
    { label: 'string: normal string', value: 'abc' },
    { label: 'string: boolean-like string true', value: 'true' },
    { label: 'string: boolean-like string false', value: 'false' },
    { label: 'string: numeric string', value: '123' },
    { label: 'string: whitespace', value: '   ' },
    { label: 'string: json-like string', value: '{"value":true}' },

    // =========================
    // 3. Number values
    // =========================
    { label: 'number: positive integer', value: 1 },
    { label: 'number: zero', value: 0 },
    { label: 'number: negative integer', value: -1 },
    { label: 'number: decimal', value: 1.5 },
    { label: 'number: NaN', value: Number.NaN },
    { label: 'number: Infinity', value: Number.POSITIVE_INFINITY },
    { label: 'number: -Infinity', value: Number.NEGATIVE_INFINITY },

    // =========================
    // 4. BigInt values
    // =========================
    { label: 'bigint: zero', value: BigInt(0) },
    { label: 'bigint: positive', value: BigInt(1) },
    { label: 'bigint: negative', value: BigInt(-1) },

    // =========================
    // 5. Symbol values
    // =========================
    { label: 'symbol: empty', value: Symbol() },
    { label: 'symbol: with description', value: Symbol('test') },

    // =========================
    // 6. Plain object values
    // =========================
    { label: 'object: empty object', value: {} },
    { label: 'object: object with boolean property', value: { value: true } },
    { label: 'object: null prototype object', value: Object.create(null) },

    // =========================
    // 7. Array values
    // =========================
    { label: 'array: empty array', value: [] },
    { label: 'array: boolean array', value: [true, false] },
    { label: 'array: single boolean array', value: [true] },
    { label: 'array: string boolean array', value: ['true'] },
    { label: 'array: mixed array', value: [true, 'false', 1] },

    // =========================
    // 8. Built-in object values
    // =========================
    { label: 'date', value: new Date('2026-01-01T00:00:00.000Z') },
    { label: 'regexp', value: /true/ },
    { label: 'error', value: new Error('Test error') },
    { label: 'map', value: new Map() },
    { label: 'set', value: new Set() },
    { label: 'weak map', value: new WeakMap() },
    { label: 'weak set', value: new WeakSet() },
    { label: 'array buffer', value: new ArrayBuffer(8) },
    { label: 'uint8 array', value: new Uint8Array([1, 2, 3]) },
    { label: 'url', value: new URL('https://example.com') },
    { label: 'url search params', value: new URLSearchParams('value=true') },

    // =========================
    // 9. Boxed primitive values
    // These look close to primitive values,
    // but their typeof is "object".
    // =========================
    { label: 'boxed boolean true', value: new Boolean(true) },
    { label: 'boxed boolean false', value: new Boolean(false) },
    { label: 'boxed string true', value: new String('true') },
    { label: 'boxed string false', value: new String('false') },
    { label: 'boxed number one', value: new Number(1) },
    { label: 'boxed number zero', value: new Number(0) },
    { label: 'boxed bigint', value: Object(BigInt(1)) },
    { label: 'boxed symbol', value: Object(Symbol('test')) },

    // =========================
    // 10. Function values
    // =========================
    { label: 'function: arrow function', value: () => { } },
    { label: 'function: normal function', value: normalFunction },
    { label: 'function: async function', value: asyncFunction },
    { label: 'function: generator function', value: generatorFunction },

    // =========================
    // 11. Class values
    // =========================
    { label: 'class constructor', value: CustomClass },
    { label: 'class instance', value: new CustomClass() },
];

// Use this only for schemas that expect an array.
export const invalidNonArrayValues: Array<InvalidValueCase> = [
    // =========================
    // 1. Absence values
    // =========================
    { label: 'null', value: null },
    { label: 'undefined', value: undefined },

    // =========================
    // 2. String values
    // =========================
    { label: 'string: empty string', value: '' },
    { label: 'string: normal string', value: 'abc' },
    { label: 'string: numeric string', value: '123' },
    { label: 'string: whitespace', value: '   ' },
    { label: 'string: array-like string', value: '[1,2,3]' },
    { label: 'string: json-like array string', value: '[{"id":"test"}]' },

    // =========================
    // 3. Number values
    // =========================
    { label: 'number: positive integer', value: 1 },
    { label: 'number: zero', value: 0 },
    { label: 'number: negative integer', value: -1 },
    { label: 'number: decimal', value: 1.5 },
    { label: 'number: NaN', value: Number.NaN },
    { label: 'number: Infinity', value: Number.POSITIVE_INFINITY },
    { label: 'number: -Infinity', value: Number.NEGATIVE_INFINITY },

    // =========================
    // 4. Boolean values
    // =========================
    { label: 'boolean: true', value: true },
    { label: 'boolean: false', value: false },

    // =========================
    // 5. BigInt values
    // =========================
    { label: 'bigint: zero', value: BigInt(0) },
    { label: 'bigint: positive', value: BigInt(1) },
    { label: 'bigint: negative', value: BigInt(-1) },

    // =========================
    // 6. Symbol values
    // =========================
    { label: 'symbol: empty', value: Symbol() },
    { label: 'symbol: with description', value: Symbol('test') },

    // =========================
    // 7. Plain object values
    // =========================
    { label: 'object: empty object', value: {} },
    { label: 'object: object with properties', value: { id: 'test-id' } },
    { label: 'object: object with array property', value: { items: [1, 2, 3] } },
    { label: 'object: null prototype object', value: Object.create(null) },

    // =========================
    // 8. Built-in object values
    // =========================
    { label: 'date', value: new Date('2026-01-01T00:00:00.000Z') },
    { label: 'regexp', value: /array/ },
    { label: 'error', value: new Error('Test error') },
    { label: 'map', value: new Map() },
    { label: 'set', value: new Set() },
    { label: 'weak map', value: new WeakMap() },
    { label: 'weak set', value: new WeakSet() },
    { label: 'array buffer', value: new ArrayBuffer(8) },
    { label: 'data view', value: new DataView(new ArrayBuffer(8)) },
    { label: 'uint8 array typed array', value: new Uint8Array([1, 2, 3]) },
    { label: 'url', value: new URL('https://example.com') },
    { label: 'url search params', value: new URLSearchParams('items=1,2,3') },

    // =========================
    // 9. Boxed primitive values
    // These look close to primitive values,
    // but their typeof is "object".
    // =========================
    { label: 'boxed string', value: new String('abc') },
    { label: 'boxed empty string', value: new String('') },
    { label: 'boxed number', value: new Number(1) },
    { label: 'boxed boolean true', value: new Boolean(true) },
    { label: 'boxed boolean false', value: new Boolean(false) },
    { label: 'boxed bigint', value: Object(BigInt(1)) },
    { label: 'boxed symbol', value: Object(Symbol('test')) },

    // =========================
    // 10. Function values
    // =========================
    { label: 'function: arrow function', value: () => { } },
    { label: 'function: normal function', value: normalFunction },
    { label: 'function: async function', value: asyncFunction },
    { label: 'function: generator function', value: generatorFunction },

    // =========================
    // 11. Class values
    // =========================
    { label: 'class constructor', value: CustomClass },
    { label: 'class instance', value: new CustomClass() },
];
