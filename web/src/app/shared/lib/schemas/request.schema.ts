import z from "zod";

export const workspaceParamsSchema = z.object({
  workspaceId: z.uuid(),
  memberId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  columnId: z.uuid().optional(),
  taskId: z.uuid().optional(),
  commentId: z.uuid().optional(),
  leadId: z.uuid().optional()
});
export type WorkspaceParamsType = z.infer<typeof workspaceParamsSchema>;

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1, 'Page must be a positive integer').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be a positive integer').default(10)
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