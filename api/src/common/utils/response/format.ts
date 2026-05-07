import z from '../../../docs/zod.js';
export const okEnvelopeSchema = <T extends z.ZodType>(dataSchema: T): z.ZodType =>
  z
    .object({
      ok: z.literal(true),
      data: dataSchema,
    })
    .strict();

export const createdEnvelopeSchema = <T extends z.ZodType>(dataSchema: T): z.ZodType =>
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

export type Ok<T = unknown> = {
  ok: true;
  data: T;
};

export type Created<T = unknown> = {
  ok: true;
  created: true;
  data: T;
};

export type Fail = z.infer<typeof failEnvelopeSchema>;

export const ok = <T>(data: T): Ok<T> => ({
  ok: true,
  data,
});

export const created = <T>(data: T): Created<T> => ({
  ok: true,
  created: true,
  data,
});

export const fail = (message: string, code?: string, details?: unknown): Fail => ({
  ok: false,
  message,
  ...(code ? { code } : {}),
  ...(details === undefined ? {} : { details }),
});