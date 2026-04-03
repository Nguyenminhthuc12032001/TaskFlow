import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { clearAuth, getAccessToken, setAccessToken } from "./auth";
import { normalizeHttpError, type ApiErrorResponse } from "./http-error";

let refreshPromise: Promise<string> | null = null;

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
        const token = getAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

async function refreshAccessToken(): Promise<string | null> {
    if (!refreshPromise) {
        refreshPromise = refreshClient
            .post('/auth/refresh')
            .then((response) => {
                const newAccessToken = response.data?.data?.accessToken ?? null;

                if (!newAccessToken) {
                    clearAuth();
                    return null;
                }

                setAccessToken(newAccessToken);
                return newAccessToken;
            })
            .catch(() => {
                clearAuth();
                return null;
            })
            .finally(() => {
                refreshPromise = null;
            })
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

