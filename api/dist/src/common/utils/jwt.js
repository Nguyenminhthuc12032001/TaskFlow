import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
export function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
export function signResetToken(payload) {
    return jwt.sign(payload, env.JWT_RESET_SECRET, { expiresIn: "15m" });
}
export function verifyResetToken(token) {
    return jwt.verify(token, env.JWT_RESET_SECRET);
}
