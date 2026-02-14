import z from "zod";
export const okEnvelopeSchema = (dataSchema) => z.object({
    ok: z.literal(true),
    data: dataSchema,
})
    .strict();
export const createdEnvelopeSchema = (dataSchema) => z.object({
    ok: z.literal(true),
    created: z.literal(true),
    data: dataSchema,
})
    .strict();
export const failEnvelopeSchema = z.object({
    ok: z.literal(false),
    message: z.string().min(1),
    details: z.unknown().optional(),
})
    .strict();
export const ok = (data) => ({
    ok: true,
    data,
});
export const created = (data) => ({
    ok: true,
    created: true,
    data,
});
export const fail = (message, details) => ({
    ok: false,
    message,
    ...(details === undefined ? {} : { details }),
});
