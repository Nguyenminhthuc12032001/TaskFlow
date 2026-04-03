import { z, type ZodType } from "zod";

export function validate<T extends ZodType>(schema: T) {
    return (data: unknown): z.infer<T> => {
        const result = schema.safeParse(data);

        if (!result.success) {
            throw new Error(`Validation failed: ${z.treeifyError(result.error)}`);
        }

        return result.data;
    }
}