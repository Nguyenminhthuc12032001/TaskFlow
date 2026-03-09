import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
export function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.TTL_ACCESS_TOKEN });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.TTL_REFRESH_TOKEN });
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
export function signResetToken(payload) {
    return jwt.sign(payload, env.JWT_RESET_SECRET, { expiresIn: env.TTL_RESET_TOKEN });
}
export function verifyResetToken(token) {
    return jwt.verify(token, env.JWT_RESET_SECRET);
}
export function signInviteToken(payload) {
    return jwt.sign(payload, env.JWT_INVITE_SECRET, { expiresIn: env.TTL_INVITE_TOKEN });
}
export function verifyInviteToken(token) {
    return jwt.verify(token, env.JWT_INVITE_SECRET);
}
