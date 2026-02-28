import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../errors/AppError.js";
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Unauthorized", 401);
    }
    const token = authHeader.slice("Bearer ".length).trim();
    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.id,
            name: payload.name,
            email: payload.email,
        };
    }
    catch (error) {
        throw new AppError("Invalid or expired token", 401);
    }
    next();
}
