import z, { object } from 'zod';
export const emptyBodySchema = z.undefined().or(object({}).strict());
export const workspaceParamsSchema = z.object({
    workspaceId: z.uuid(),
    memberId: z.uuid().optional(),
    projectId: z.uuid().optional(),
    columnId: z.uuid().optional(),
    taskId: z.uuid().optional(),
    commentId: z.uuid().optional(),
    leadId: z.uuid().optional()
});
export const searchQuerySchema = z.preprocess((value) => {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}, z.string("Search query must be greater than 0 characters long")
    .min(1, "Search query must be at least 1 character long")
    .max(100, "Search query must be at most 100 characters long")
    .optional());
export const dataRangeQuerySchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional()
});
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1, 'Page must be a positive integer').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be a positive integer').default(10),
});
export const paginationMetaSchema = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
});
