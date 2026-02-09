import { z } from "zod";
export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                ok: false,
                errors: z.treeifyError(result.error),
            });
        }
        req.body = result.data;
        next();
    };
}
;
