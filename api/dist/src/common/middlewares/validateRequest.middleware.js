import { z } from '../../docs/zod.js';
import { AppError } from '../errors/AppError.js';
export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            throw new AppError('Invalid request body', 400, 'VALIDATION_ERROR', z.treeifyError(result.error));
        }
        req.body = result.data;
        next();
    };
}
export function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            throw new AppError('Invalid request parameters', 400, 'VALIDATION_ERROR', z.treeifyError(result.error));
        }
        next();
    };
}
export function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            throw new AppError('Invalid query parameters', 400, 'VALIDATION_ERROR', z.treeifyError(result.error));
        }
        req.query = result.data;
        next();
    };
}
