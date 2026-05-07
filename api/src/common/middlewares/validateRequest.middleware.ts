import { Request, Response, NextFunction } from 'express';
import { ZodType, z } from '../../docs/zod.js';
import { AppError } from '../errors/AppError.js';

export function validateBody<T extends ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        'Invalid request body',
        400,
        'VALIDATION_ERROR',
        z.treeifyError(result.error),
      );
    }

    req.body = result.data;
    next();
  };
}

export function validateParams<T extends ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      throw new AppError(
        'Invalid request parameters',
        400,
        'VALIDATION_ERROR',
        z.treeifyError(result.error),
      );
    }

    next();
  };
}

export function validateQuery<T extends ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      throw new AppError(
        'Invalid query parameters',
        400,
        'VALIDATION_ERROR',
        z.treeifyError(result.error),
      );
    }
 
    next();
  };
}
