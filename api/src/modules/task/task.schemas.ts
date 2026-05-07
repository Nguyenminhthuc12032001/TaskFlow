import z from '../../docs/zod.js';
import { TaskPriority } from '../../../prisma/generated/enums.js';
import { dataRangeQuerySchema, paginationMetaSchema, paginationQuerySchema, searchQuerySchema } from '../../common/schemas/common.schemas.js';
import { safeUserSchema } from '../auth/auth.schemas.js';

// REQUEST

export const listTaskByColumnQuerySchema = paginationQuerySchema.extend({
  search: searchQuerySchema,
  ...dataRangeQuerySchema.shape,
  dueDateRange: dataRangeQuerySchema.optional(),
  priority: z.enum(TaskPriority).optional(),
})
export type ListTaskByColumnQueryType = z.infer<typeof listTaskByColumnQuerySchema>;

export const createBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters long')
    .max(100, 'Title must be at most 100 characters long'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .max(100, 'Description must be at most 100 characters long')
    .optional(),
  priority: z.enum(TaskPriority).optional(),
  dueDate: z.coerce.date().optional(),
});
export type CreateBodyType = z.infer<typeof createBodySchema>;

export const assignBodySchema = z.object({
  userId: z.uuid(),
});
export type AssignBodyType = z.infer<typeof assignBodySchema>;

export const updateBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters long')
    .max(100, 'Title must be at most 100 characters long')
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .max(100, 'Description must be at most 100 characters long')
    .optional(),
  priority: z.enum(TaskPriority).optional(),
  dueDate: z.coerce.date().optional(),
});
export type UpdateBodyType = z.infer<typeof updateBodySchema>;

export const reOrderBodySchema = z
  .array(
    z
      .object({
        taskId: z.uuid(),
        position: z
          .number()
          .int('Position must be an integer')
          .min(0, 'Position must be greater than or equal to 0'),
      })
      .strict(),
  )
  .min(1, 'ReOrder data cannot be empty')
  .superRefine((items, ctx) => {
    const idSet = new Set<string>();
    const positionSet = new Set<number>();

    items.forEach((item, index) => {
      if (idSet.has(item.taskId)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Duplicate id is not allowed',
          path: [index, 'columnId'],
        });
      }
      idSet.add(item.taskId);

      if (positionSet.has(item.position)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Duplicate position is not allowed',
          path: [index, 'position'],
        });
      }
      positionSet.add(item.position);
    });
  });
export type ReOrderBodyType = z.infer<typeof reOrderBodySchema>;

export const bulkRemoveBodySchema = z
  .array(
    z.object({
      taskId: z.uuid(),
    }),
  )
  .min(1, 'Bulk remove id cannot be empty')
  .superRefine((items, ctx) => {
    const idSet = new Set<string>();

    items.forEach((item, index) => {
      if (idSet.has(item.taskId)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Duplicate id is not allowed',
          path: [index, 'taskId'],
        });
      }
      idSet.add(item.taskId);
    });
  });
export type BulkRemoveBodyType = z.infer<typeof bulkRemoveBodySchema>;

// Response
export const safeTaskSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  columnId: z.uuid(),
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters long')
    .max(100, 'Title must be at most 100 characters long'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .max(100, 'Description must be at most 100 characters long')
    .optional(),
  priority: z.enum(TaskPriority),
  dueDate: z.coerce.date().optional(),
  position: z
    .number()
    .int('Position must be an integer')
    .min(0, 'Position must be a positive number')
    .optional(),
  createdBy: z.uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  assignees: z
    .array(
      z.object({
        taskId: z.uuid(),
        userId: z.uuid(),
      }),
    )
    .optional(),
});
export type SafeTask = z.infer<typeof safeTaskSchema>;

export const safeTasksSchema = z.object({
  data: z.array(safeTaskSchema),
  paginationMeta: paginationMetaSchema
});
export type SafeTasks = z.infer<typeof safeTasksSchema>;

export const safeAssigneeSchema = z.object({
  taskId: z.uuid(),
  userId: z.uuid(),
});
export type SafeAssignee = z.infer<typeof safeAssigneeSchema>;

export const safeTaskDetailAssigneeSchema = z.object({
  taskId: z.uuid(),
  userId: z.uuid(),
  user: safeUserSchema,
});
export type SafeTaskDetailAssignee = z.infer<typeof safeTaskDetailAssigneeSchema>;

export const safeTaskDetailSchema = safeTaskSchema.extend({
  assignees: z.array(safeTaskDetailAssigneeSchema),
});
export type SafeTaskDetail = z.infer<typeof safeTaskDetailSchema>;
