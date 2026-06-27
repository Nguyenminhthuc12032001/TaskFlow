import {
  dateRangeQuerySchema,
  dateSchema,
  paginationMetaSchema,
  paginationQuerySchema,
  searchQuerySchema,
} from '../../common/schemas/common.schemas.js';
import z from '../../docs/zod.js';

// REQUEST

export const listProjectsQuerySchema = dateRangeQuerySchema.safeExtend({
  search: searchQuerySchema,
  ...paginationQuerySchema.shape,
}).strict();
export type ListProjectsQueryType = z.infer<typeof listProjectsQuerySchema>;

export const createBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must be at most 100 characters long'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .max(100, 'Description must be at most 100 characters long')
    .optional(),
}).strict();
export type CreateBodyType = z.infer<typeof createBodySchema>;

export const updateBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must be at most 100 characters long')
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .max(100, 'Description must be at most 100 characters long')
    .optional(),
}).strict();
export type UpdateBodyType = z.infer<typeof updateBodySchema>;

// RESPONSE

export const safeProjectResponseSchema = z.object({
  workspaceId: z.uuid(),
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must be at most 100 characters long'),
  description: z
    .string()
    .trim()
    .min(10, 'Name must be at least 10 characters long')
    .max(100, 'Name must be at most 100 characters long')
    .optional(),
  createdAt: dateSchema,
  createdBy: z.uuid(),
}).strict();
export type SafeProjectResponseType = z.infer<typeof safeProjectResponseSchema>;

export const listProjectsResponseSchema = z.object({
  data: z.array(safeProjectResponseSchema),
  paginationMeta: paginationMetaSchema,
}).strict();
export type ListProjectResponseType = z.infer<typeof listProjectsResponseSchema>;
