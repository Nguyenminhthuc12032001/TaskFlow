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
