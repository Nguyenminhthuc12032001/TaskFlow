import { verifyAccessToken } from "../utils/jwt.js";
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role
        };
    }
    catch (error) {
        return res.status(401).json({ message: `Invalid or expired token: ${error}` });
    }
    next();
}
