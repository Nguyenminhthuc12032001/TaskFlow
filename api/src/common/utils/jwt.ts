import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import ms from "ms";

// ============ ACCESS ============
export type AccessTokenPayload = {
    id: string;
    jti: string;
    email?: string;
    name?: string;
}

export function signAccessToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: (env.TTL_ACCESS_TOKEN as ms.StringValue) });
}

export function verifyAccessToken(token: string) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

// ============ REFRESH ============
export type RefreshTokenPayload = {
    id: string;
    jti: string;
    version?: number;
}

export function signRefreshToken(payload: RefreshTokenPayload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: (env.TTL_REFRESH_TOKEN as ms.StringValue) });
}

export function verifyRefreshToken(token: string) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

// ============ RESET_PASSWORD ============
export type ResetTokenPayload = {
    id: string;
    jti: string;
    email: string;
}

export function signResetToken(payload: ResetTokenPayload) {
    return jwt.sign(payload, env.JWT_RESET_SECRET, { expiresIn: (env.TTL_RESET_TOKEN as ms.StringValue) });
}

export function verifyResetToken(token: string) {
    return jwt.verify(token, env.JWT_RESET_SECRET) as ResetTokenPayload
}

// =========== INVITE ============
export type InviteTokenPayload = {
    id: string;
    jti: string;
    email: string;
    workspaceId: string;
}

export function signInviteToken(payload: InviteTokenPayload) {
    return jwt.sign(payload, env.JWT_INVITE_SECRET, { expiresIn: (env.TTL_INVITE_TOKEN as ms.StringValue) });
}

export function verifyInviteToken(token: string) {
    return jwt.verify(token, env.JWT_INVITE_SECRET) as InviteTokenPayload
}