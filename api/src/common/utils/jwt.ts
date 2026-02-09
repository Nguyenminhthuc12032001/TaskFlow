import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

// ============ ACCESS ============
export type AccessTokenPayload = {
    id: string;
    jti: string;
    email?: string;
    name?: string;
}

export function signAccessToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
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
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
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
    return jwt.sign(payload, env.JWT_RESET_SECRET, { expiresIn: "15m" })
}

export function verifyResetToken(token: string) {
    return jwt.verify(token, env.JWT_RESET_SECRET) as ResetTokenPayload
}