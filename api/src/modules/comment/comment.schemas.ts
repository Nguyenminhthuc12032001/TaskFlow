import {
  dataRangeQuerySchema,
  paginationMetaSchema,
  paginationQuerySchema,
  searchQuerySchema,
} from '../../common/schemas/common.schemas.js';
import z from '../../docs/zod.js';

// REQUEST

export const listCommentsQuerySchema = dataRangeQuerySchema.safeExtend({
  search: searchQuerySchema,
  ...paginationQuerySchema.shape,
  parentId: z.uuid().optional(),
});
export type ListCommentsQueryType = z.infer<typeof listCommentsQuerySchema>;

export const createBodySchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(5, 'Comment must be at least 5 characters long')
      .max(100, 'Comment must be at most 100 characters long'),
  })
  .strict();
export type CreateBodyType = z.infer<typeof createBodySchema>;

export const updateBodySchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(5, 'Comment must be at least 5 characters long')
      .max(100, 'Comment must be at most 100 characters long'),
  })
  .strict();
export type UpdateBodyType = z.infer<typeof updateBodySchema>;

// RESPONSE

export const safeCommentSchema = z
  .object({
    id: z.uuid(),
    taskId: z.uuid(),
    authorId: z.uuid(),
    parentId: z.uuid().optional(),
    content: z
      .string()
      .trim()
      .min(5, 'Comment must be at least 5 characters long')
      .max(100, 'Comment must be at most 100 characters long'),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    totalReplies: z.number().int().min(0),
  })
  .strict();
export type SafeCommentType = z.infer<typeof safeCommentSchema>;

export const safeCommentsSchema = z
  .object({
    data: z.array(safeCommentSchema).superRefine((items, ctx) => {
      const idSet = new Set<string>();

      items.forEach((item, index) => {
        if (idSet.has(item.id)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Duplicate id is not allowed',
            path: [index, 'commentId'],
          });
        }
        idSet.add(item.id);
      });
    }),
    paginationMeta: paginationMetaSchema,
  })
  .strict();
export type SafeCommentsType = z.infer<typeof safeCommentsSchema>;
