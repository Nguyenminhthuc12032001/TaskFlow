import z from "zod";
import { AppError } from "../../errors/AppError.js";
export function validateResponse(schema) {
    return (data) => {
        const result = schema.safeParse(data);
        if (!result.success) {
            throw new AppError(`Invalid API response shape: ${z.treeifyError(result.error)}`, 500);
        }
        return result.data;
    };
}
