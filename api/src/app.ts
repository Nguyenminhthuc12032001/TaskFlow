import express, { type Request, type Response } from "express";
import { corsMiddleware } from "./config/cors.js"; 
import { rateLimitMiddleware } from "./common/middlewares/rateLimit.middleware.js";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(rateLimitMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true })
})

app.use((req: Request, res: Response) => {
    res.status(404).json({
        ok: false,
        error: { message: `Route not found: ${req.method} ${req.originalUrl}` }
    })
})

app.use(errorMiddleware);

export default app;