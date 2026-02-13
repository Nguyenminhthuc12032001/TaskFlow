import express, { type Request, type Response } from "express";
import { corsMiddleware } from "./config/cors.js";
import { rateLimitMiddleware } from "./common/middlewares/rateLimit.middleware.js";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { setupSwagger } from "./docs/swagger.js";
import cookieParser from "cookie-parser";
import { csrfProtection } from "./common/middlewares/csrf.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(rateLimitMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true })
})

app.get("/csurf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() })
})

app.use("/api/auth", authRoutes);
setupSwagger(app);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        ok: false,
        error: { message: `Route not found: ${req.method} ${req.originalUrl}` }
    })
})

app.use(errorMiddleware);

export default app;