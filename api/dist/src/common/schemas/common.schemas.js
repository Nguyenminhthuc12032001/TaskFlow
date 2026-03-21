import z, { object } from "zod";
export const emptyBodySchema = z.undefined().or(object({}).strict());
