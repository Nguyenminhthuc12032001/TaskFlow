import z, { type ZodType } from "zod";
export const okEnvelopeSchema = <T extends ZodType>(dataSchema: T) =>
  z
    .object({
      ok: z.literal(true),
      data: dataSchema,
    })
    .strict();

export const createdEnvelopeSchema = <T extends ZodType>(dataSchema: T) =>
  z
    .object({
      ok: z.literal(true),
      created: z.literal(true),
      data: dataSchema,
    })
    .strict();

export const failEnvelopeSchema = z
  .object({
    ok: z.literal(false),
    message: z.string().min(1),
    code: z.string().optional(),
    details: z.unknown().optional(),
  })
  .strict();