import axios from "axios";

export type ApiErrorResponse = {
    message?: string;
    code?: string;
    details?: unknown;
};

export class HttpError extends Error {
    status: number;
    code: string;
    details: unknown;

    constructor(params: {
        status: number;
        message?: string;
        code?: string;
        details?: unknown;
    }) {
        super(params.message);
        this.status = params.status;
        this.code = params.code || 'UNKNOWN_ERROR';
        this.details = params.details;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

export function normalizeHttpError(error: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return new HttpError({
            status: error.response?.status ?? 500,
            message: error.response?.data.message || 'Request failed',
            code: error.response?.data.code,
            details: error.response?.data.details
        })
    }

    return new HttpError({
        status: 500,
        message: 'Unexpected error',
        code: 'UNKNOWN_ERROR',
        details: error
    });
};

export type ZodTreeErrorNode = {
    errors?: string[];
    properties?: Record<string, ZodTreeErrorNode>;
    items?: ZodTreeErrorNode[];
};

export function normalizeZodError(
    node: ZodTreeErrorNode,
    path = "",
) {
    const result: Record<string, string[]> = {};

    if (node.errors && node.errors.length > 0) {
        if (path) {
            result[path] = node.errors;
        } else {
            result[""] = node.errors;
        }
    }

    if (node.properties) {
        for (const key in node.properties) {
            const child = node.properties[key];

            Object.assign(result, normalizeZodError(child, path ? `${path}.${key}` : key));
        }
    }

    if (node.items) {
        node.items.forEach((child, index) => {
            Object.assign(result, normalizeZodError(child, `${path}[${index}]`));
        });
    }

    return result;
}