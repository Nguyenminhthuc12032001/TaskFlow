import type z from "zod";
import type { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../lib/response.schemas";
import type { ZodType } from "zod";

export type OkFromSchema<T extends ZodType> = z.infer<ReturnType<typeof okEnvelopeSchema<T>>>;

export type CreatedFromSchema<T extends ZodType> = z.infer<ReturnType<typeof createdEnvelopeSchema<T>>>;

export type Fail = z.infer<typeof failEnvelopeSchema>;