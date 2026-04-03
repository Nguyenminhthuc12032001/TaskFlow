import axios from "axios";

export type ApiErrorResponse = {
    message: string;
    code: string;
    detail: unknown;
};

export function normalizeHttpError(error: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        return {
            status: error.response?.status,
            message:
                error.response?.data?.message || error.message || 'Request failed',
            code: error.response?.data?.code || 'UNKNOWN_ERROR',
            detail: error.response?.data?.detail || null,
        };
    }

    return {
        status: 500,
        message: 'Unexpected error',
        code: 'UNKNOWN_ERROR',
        detail: 'An unexpected error occurred',
    };
};