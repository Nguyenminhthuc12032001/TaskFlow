import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
    PORT: z.number().default(4000),
    DATABASE_URL: z.url(),
    CORS_ORIGIN: z.string().default("*"),

    JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET should be at least 16 chars"),
    JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET should be at least 16 chars"),
    JWT_RESET_SECRET: z.string().min(16, "JWT_RESET_SECRET should be at least 16 chars"),
    INVITE_TOKEN_SECRET: z.string().min(16, "INVITE_TOKEN_SECRET should be at least 16 chars"),

    EMAIL_USER: z.email("EMAIL_USER must be a valid email"),
    EMAIL_APP_PASSWORD: z.string().min(10, "EMAIL_APP_PASSWORD looks invalid"),
    EMAIL_FROM: z.string().min(3),
    FRONTEND_URL: z.url(),
    NODE_ENV: z.string().min(5),
    LOG_LEVEL: z.string().min(2)
});

const rawEnv = {
    PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
    DATABASE_URL: process.env.DATABASE_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,
    INVITE_TOKEN_SECRET: process.env.INVITE_TOKEN_SECRET,

    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
    FRONTEND_URL: process.env.FRONTEND_URL,
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL
}

export const env = envSchema.parse(rawEnv)