import { useSyncExternalStore } from "react";
import type { SafeUserResponse } from "./auth.schemas";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export type AuthState = {
    status: AuthStatus;
    accessToken: string | null;
    user: SafeUserResponse | null;
};

let authState: AuthState = {
    status: "checking",
    accessToken: null,
    user: null
};

const listeners = new Set<() => void>();

function  emitChange() {
    listeners.forEach((listener) => listener())
};

export function getAuthState() : AuthState {
    return authState;
};

export function setAuthState(data: AuthState): void {
    authState = data;
    emitChange();
};

export function clearAuth(): void {
    authState = {
        status: "unauthenticated",
        accessToken: null,
        user: null
    };
    emitChange();
};

export function subscribeAuth(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};

export function useAuth(): AuthState {
    return useSyncExternalStore(subscribeAuth, getAuthState, getAuthState);
};

