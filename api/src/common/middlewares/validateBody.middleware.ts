import { Request, Response, NextFunction } from "express";
import { ZodType, z } from "zod";
import { fail } from "../utils/response/format.js";

export function validateBody<T extends ZodType>(schema: T) {
    return ( req: Request, res: Response, next: NextFunction ) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json(fail("Validation failed", z.treeifyError(result.error)))
        }

        req.body = result.data;
        next();
    }
};