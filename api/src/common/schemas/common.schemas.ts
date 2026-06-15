import z, { object } from 'zod';

export const emptyBodySchema = z.undefined().or(object({}).strict());

export const positiveIntegerSchema = z.preprocess((value) => {
  if (value === undefined) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return value;
  return Number(trimmed);
}, z.number().int().positive());

export const workspaceParamsSchema = z.object({
  workspaceId: z.uuid(),
  memberId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  columnId: z.uuid().optional(),
  taskId: z.uuid().optional(),
  commentId: z.uuid().optional(),
  leadId: z.uuid().optional(),
});
export type WorkspaceParamsType = z.infer<typeof workspaceParamsSchema>;

export const searchQuerySchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().min(1, 'Search query must be at least 1 character long').max(100, 'Search query must be at most 100 characters long').optional());
export type SearchQueryType = z.infer<typeof searchQuerySchema>;

const optionalDateQuerySchema = z.preprocess((value) => {
  if (value === undefined) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return value;

    const date = new Date(trimmed);

    if (isNaN(date.getTime())) return value;
    return date;
  }

  return value;
}, z.date().optional());

export const dateSchema = z.preprocess((value) => {
  if (value === undefined) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return value;

    const date = new Date(trimmed);

    if (isNaN(date.getTime())) return value;
    return date;
  }

  return value;
}, z.date());

export const dataRangeQuerySchema = z
  .object({
    startDate: optionalDateQuerySchema,
    endDate: optionalDateQuerySchema,
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Start date must be before end date',
        path: ['startDate'],
      });
    }
  });
export type DataRangeQueryType = z.infer<typeof dataRangeQuerySchema>;

export const paginationQuerySchema = z.object({
  page: positiveIntegerSchema.optional(),
  limit: positiveIntegerSchema.optional(),
});
export type PaginationQueryType = z.infer<typeof paginationQuerySchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});
export type PaginationMetaType = z.infer<typeof paginationMetaSchema>;
