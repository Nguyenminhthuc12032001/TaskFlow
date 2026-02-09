import cors from "cors";
import { env } from "./env.js";
export const corsMiddleware = cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
    credentials: true
});
