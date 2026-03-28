import { z } from '../docs/zod.js';
import 'dotenv/config';
import ms from 'ms';

const ttl = z
  .string()
  .default('15m')
  .refine((val) => ms(val as ms.StringValue) !== undefined, 'Invalid TTL format');

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.url(),
  CORS_ORIGIN: z.string().default('*'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET should be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET should be at least 16 chars'),
  JWT_RESET_SECRET: z.string().min(16, 'JWT_RESET_SECRET should be at least 16 chars'),
  JWT_INVITE_SECRET: z.string().min(16, 'JWT_INVITE_SECRET should be at least 16 chars'),
  INVITE_TOKEN_SECRET: z.string().min(16, 'INVITE_TOKEN_SECRET should be at least 16 chars'),

  EMAIL_USER: z.email('EMAIL_USER must be a valid email'),
  EMAIL_APP_PASSWORD: z.string().min(10, 'EMAIL_APP_PASSWORD looks invalid'),
  EMAIL_FROM: z.string().min(3),
  FRONTEND_URL: z.url(),
  NODE_ENV: z.string().min(5),
  LOG_LEVEL: z.string().min(2),

  TTL_ACCESS_TOKEN: ttl.default('15m'),
  TTL_REFRESH_TOKEN: ttl.default('7d'),
  TTL_RESET_TOKEN: ttl.default('15m'),
  TTL_INVITE_TOKEN: ttl.default('7d'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment variables: ${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
