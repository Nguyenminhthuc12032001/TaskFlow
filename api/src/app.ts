import express, { type Request, type Response } from "express";
import { corsMiddleware } from "./config/cors.js";
import { rateLimitMiddleware } from "./common/middlewares/rateLimit.middleware.js";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";

import authRoutes from "./modules/auth/auth.routes.js";
import workSpaceRoutes from "./modules/workspace/workspace.routes.js";
import projectRoutes from "./modules/project/project.routes.js";
import columnRoutes from "./modules/column/column.routes.js";
import taskRoutes from "./modules/task/task.routes.js";
import commentRoutes from "./modules/comment/comment.routes.js";

import { setupSwagger } from "./docs/swagger.js";
import cookieParser from "cookie-parser";
import { csrfProtection } from "./common/middlewares/csrf.middleware.js";
import { log } from "./common/logger/logger.js";
import { requestIdMiddleware } from "./common/middlewares/requestId.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(requestIdMiddleware);

app.use((req, res, next) => {
    log.info(
        {
            method: req.method,
            url: req.originalUrl,
            requestId: req.requestId,
        },
        "Incoming request"
    );
    next();
});

app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
        log[level]({
            requestId: req.requestId,
            status: res.statusCode,
            duration: `${Date.now() - start}ms`
        }, "Request completed")
    });
    next();
});

app.use(rateLimitMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true })
});

app.get("/csurf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() })
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workSpaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);

setupSwagger(app);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        ok: false,
        error: { message: `Route not found: ${req.method} ${req.originalUrl}` }
    })
});

app.use(errorMiddleware);

export default app;