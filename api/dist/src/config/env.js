import { z } from "zod";
import "dotenv/config";
const envSchema = z.object({
    PORT: z.number().default(4000),
    DATABASE_URL: z.url(),
    CORS_ORIGIN: z.string().default("*"),
    JWT_ACCESS_SECRET: z.string().min(15, "JWT_ACCESS_SECRET should be at least 16 chars"),
    JWT_REFRESH_SECRET: z.string().min(15, "JWT_REFRESH_SECRET should be at least 16 chars"),
    INVITE_TOKEN_SECRET: z.string().min(15, "INVITE_TOKEN_SECRET should be at least 16 chars"),
});
const rawEnv = {
    PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
    DATABASE_URL: process.env.DATABASE_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    JWT_SERECT: process.env.JWT_SERECT,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    INVITE_TOKEN_SECRET: process.env.INVITE_TOKEN_SECRET,
};
export const env = envSchema.parse(rawEnv);
