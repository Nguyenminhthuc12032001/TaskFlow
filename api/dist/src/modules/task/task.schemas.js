import z from '../../docs/zod.js';
import { TaskPriority } from '../../../prisma/generated/enums.js';
// REQUEST
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
    position: z
        .number()
        .int('Position must be an integer')
        .min(0, 'Position must be a positive number')
        .optional(),
});
export const assignBodySchema = z.object({
    userId: z.uuid(),
});
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
    position: z
        .number()
        .int('Position must be an integer')
        .min(0, 'Position must be a positive number')
        .optional(),
});
export const reOrderBodySchema = z
    .array(z
    .object({
    taskId: z.uuid(),
    position: z
        .number()
        .int('Position must be an integer')
        .min(0, 'Position must be greater than or equal to 0'),
})
    .strict())
    .min(1, 'ReOrder data cannot be empty')
    .superRefine((items, ctx) => {
    const idSet = new Set();
    const positionSet = new Set();
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
export const bulkRemoveBodySchema = z
    .array(z.object({
    taskId: z.uuid(),
}))
    .min(1, 'Bulk remove id cannot be empty')
    .superRefine((items, ctx) => {
    const idSet = new Set();
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
    dueDate: z.date().optional(),
    position: z
        .number()
        .int('Position must be an integer')
        .min(0, 'Position must be a positive number'),
    createdBy: z.uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const safeTasksSchema = z.array(safeTaskSchema);
export const safeAssigneeSchema = z.object({
    taskId: z.uuid(),
    userId: z.uuid(),
});
