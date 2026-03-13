import z, { ZodType } from "../../../docs/zod.js";
import { AppError } from "../../errors/AppError.js";

export function validateResponse<T extends ZodType>(schema: T) {
    return (data: unknown): z.infer<T> => {
        const result = schema.safeParse(data);

        if (!result.success) {
            throw new AppError(`Invalid API response shape: ${z.treeifyError(result.error)}`, 500);
        }

        return result.data;
    }
}
