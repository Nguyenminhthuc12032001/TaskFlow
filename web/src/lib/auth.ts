import type { SafeUserResponse } from "../features/auth/auth.schemas";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
    return accessToken;
};

export function setAccessToken(token: string): void {
    accessToken = token;
};

export function clearAuth(): void {
    accessToken = null;
    user = null;
};

let user: SafeUserResponse | null = null;

export function getUser(): SafeUserResponse | null {
    return user;
}

export function setUser(newUser: SafeUserResponse): void {
    user = newUser;
}

