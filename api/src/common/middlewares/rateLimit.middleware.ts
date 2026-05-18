import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const rateLimitMiddleware = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 120),
  skip: () => isTest && process.env.ENABLE_RATE_LIMIT_TEST !== 'true',
});
