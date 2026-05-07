import { dataRangeQuerySchema, paginationMetaSchema, paginationQuerySchema, searchQuerySchema } from '../../common/schemas/common.schemas.js';
import z from '../../docs/zod.js';
// REQUEST
export const listCommentsQuerySchema = paginationQuerySchema.extend({
    search: searchQuerySchema,
    ...dataRangeQuerySchema.shape,
    parentId: z.uuid().optional(),
});
export const createBodySchema = z
    .object({
    content: z
        .string()
        .trim()
        .min(5, 'Comment must be at least 5 characters long')
        .max(100, 'Comment must be at most 100 characters long'),
})
    .strict();
export const updateBodySchema = z
    .object({
    content: z
        .string()
        .trim()
        .min(5, 'Comment must be at least 5 characters long')
        .max(100, 'Comment must be at most 100 characters long'),
})
    .strict();
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
})
    .strict();
export const safeCommentsSchema = z.object({
    data: z.array(safeCommentSchema).superRefine((items, ctx) => {
        const idSet = new Set();
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
    paginationMeta: paginationMetaSchema
}).strict();
