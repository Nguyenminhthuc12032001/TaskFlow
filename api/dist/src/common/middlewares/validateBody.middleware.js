import { z } from "zod";
import { fail } from "../utils/response/format.js";
export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json(fail("Validation failed", z.treeifyError(result.error)));
        }
        req.body = result.data;
        next();
    };
}
;
