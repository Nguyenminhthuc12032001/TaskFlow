import { z } from "../../docs/zod.js";
import { AppError } from "../errors/AppError.js";
export function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            throw new AppError("Invalid request params", 400, "VALIDATION_ERROR", z.treeifyError(result.error));
        }
        req.params = result.data;
        next();
    };
}
