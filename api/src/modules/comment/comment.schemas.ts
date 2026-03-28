// REQUEST

import z from '../../docs/zod.js';

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
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type SafeCommentType = z.infer<typeof safeCommentSchema>;

export const safeCommentsSchema = z.array(safeCommentSchema).superRefine((items, ctx) => {
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
});
export type SafeCommentsType = z.infer<typeof safeCommentsSchema>;
