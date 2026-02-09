import { ZodType } from "zod";
import { AppError } from "../../errors/AppError.js";

export function validateResponse<T extends ZodType>(schema: T) {
    return (data: unknown) => {
        const result = schema.safeParse(data);

        if (!result.success) {
            throw new AppError("Invalid API response shape", 500);
        }

        return result.data;
    }
}