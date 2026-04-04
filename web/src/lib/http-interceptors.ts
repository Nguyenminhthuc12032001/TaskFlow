import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { normalizeHttpError, type ApiErrorResponse } from "./http-error";
import { clearAuth, getAuthState, setAuthState, type AuthState } from "../features/auth/auth.store"
import { okEnvelopeSchema } from "./response.schemas";
import { refreshResponseSchema } from "../features/auth/auth.schemas";
import { validate } from "./validate";

let refreshPromise: Promise<string | null> | null = null;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    timeout: 15000,
    headers: {
        Accept: 'application/json',
    }
});

const refreshClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    timeout: 15000,
    headers: {
        Accept: 'application/json'
    }
});

http.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAuthState().accessToken;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export async function refreshAccessToken(): Promise<string | null> {
    if (!refreshPromise) {

        refreshPromise = (async () => {
            try {
                const csrfToken = await refreshClient.get('/csurf-token').then(res => res.data.csrfToken);

                const response = await refreshClient.post('/auth/refresh', {}, {
                    headers: {
                        'x-csrf-token': csrfToken,
                    }
                });

                if (response.status !== 200) {
                    throw new Error(`Refresh failed with status ${response.status}`);
                }

                const envelope = response.data;
                const envelopeSchema = okEnvelopeSchema(refreshResponseSchema);
                const validatedEnvelope = validate(envelopeSchema)(envelope)

                if (!validatedEnvelope.data.accessToken) {
                    clearAuth();
                    return null;
                }

                const authState: AuthState = {
                    status: "authenticated",
                    accessToken: validatedEnvelope.data.accessToken,
                    user: validatedEnvelope.data.user
                }

                setAuthState(authState);

                return validatedEnvelope.data.accessToken;
            } catch {
                clearAuth();
                return null;
            } finally {
                refreshPromise = null;
            }
        })();
    }

    return refreshPromise;
}

http.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        if (!originalRequest) {
            return Promise.reject(normalizeHttpError(error));
        }

        const status = error.response?.status;

        const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
        const isLoginRequest = originalRequest.url?.includes('/auth/login');

        if (status === 401 && !isRefreshRequest && !isLoginRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            const newAccessToken = await refreshAccessToken();

            if (!newAccessToken) {
                return Promise.reject(normalizeHttpError(error));
            }

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return http(originalRequest);
        }

        return Promise.reject(normalizeHttpError(error));
    }
);

