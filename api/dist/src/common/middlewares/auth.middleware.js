import { verifyAccessToken } from "../utils/jwt.js";
import { fail } from "../utils/response/format.js";
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json(fail("Unauthorized", { code: "ACCESS_TOKEN_MISSING" }));
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
        return res.status(401).json(fail("Invalid or expired token", { code: "ACCESS_TOKEN_INVALID" }));
    }
    next();
}
