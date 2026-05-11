import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { fail } from '../utils/response/format.js';
import { log } from '../logger/logger.js';

function isCsrfError(err: Error): boolean {
  return 'code' in err && err.code === 'EBADCSRFTOKEN';
}

function isJsonParseError(err: Error): boolean {
  return (
    'status' in err && err.status === 400 && 'type' in err && err.type === 'entity.parse.failed'
  );
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  if (err instanceof Error && isCsrfError(err)) {
    return res.status(403).json(fail('Invalid CSRF token', 'CSRF_ERROR'));
  }

  if (err instanceof Error && isJsonParseError(err)) {
    return res.status(400).json(fail('Invalid request body', 'VALIDATION_ERROR'));
  }

  if (err instanceof AppError) {
    return res.status(err.status).json(fail(err.message, err.code, err.detail));
  }

  log.error(
    {
      error: err,
      requestId: req.requestId,
      userId: req.user?.id,
    },
    'Unhandled error',
  );

  return res.status(500).json(fail(`Internal Server Error`));
}
