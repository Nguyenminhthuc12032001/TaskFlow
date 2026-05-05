import { LeadStage, TaskPriority } from '../../../prisma/generated/enums.js';
import z from '../../docs/zod.js';
import { emailSchema } from '../auth/auth.schemas.js';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { safeTaskSchema } from '../task/task.schemas.js';
import { paginationMetaSchema } from '../../common/schemas/common.schemas.js';
// REQUEST
export const createBodySchema = z.object({
    name: z
        .string()
        .trim()
        .min(5, 'Name must be at least 5 characters long')
        .max(100, 'Name must be at most 100 characters long'),
    email: emailSchema.optional(),
    phone: z
        .string()
        .refine(isValidPhoneNumber, {
        message: 'Is valid phone number',
    })
        .optional(),
    source: z
        .string()
        .trim()
        .min(10, 'Source must be at least 10 characters long')
        .max(100, 'Source must be at most 100 characters long')
        .optional(),
    stage: z.enum(LeadStage).optional(),
    note: z
        .string()
        .trim()
        .min(5, 'Note must be at least 5 characters long')
        .max(200, 'Note must be at most 100 characters long'),
});
export const updateBodySchema = z.object({
    name: z
        .string()
        .trim()
        .min(5, 'Name must be at least 5 characters long')
        .max(100, 'Name must be at most 100 characters long')
        .optional(),
    email: emailSchema.optional(),
    phone: z
        .string()
        .refine(isValidPhoneNumber, {
        message: 'Is valid phone number',
    })
        .optional(),
    source: z
        .string()
        .trim()
        .min(10, 'Source must be at least 10 characters long')
        .max(100, 'Source must be at most 100 characters long')
        .optional(),
    note: z
        .string()
        .trim()
        .min(5, 'Note must be at least 5 characters long')
        .max(200, 'Note must be at most 100 characters long')
        .optional(),
});
export const updateStageBodySchema = z.object({
    stage: z.enum(LeadStage),
});
export const createFollowUpTaskBodySchema = z.object({
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
// RESPONSE
export const safeLeadSchema = z.object({
    id: z.uuid(),
    workspaceId: z.uuid(),
    name: z
        .string()
        .trim()
        .min(5, 'Name must be at least 5 characters long')
        .max(100, 'Name must be at most 100 characters long'),
    email: emailSchema.optional(),
    phone: z
        .string()
        .refine(isValidPhoneNumber, {
        message: 'Is valid phone number',
    })
        .optional(),
    source: z
        .string()
        .trim()
        .min(10, 'Source must be at least 10 characters long')
        .max(100, 'Source must be at most 100 characters long')
        .optional(),
    stage: z.enum(LeadStage),
    note: z
        .string()
        .trim()
        .min(5, 'Note must be at least 5 characters long')
        .max(200, 'Note must be at most 100 characters long'),
    createdBy: z.uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});
export const safeLeadWorkspaceSchema = z.object({
    id: z.uuid(),
    name: z.string(),
});
export const safeLeadWithWorkspaceSchema = safeLeadSchema.extend({
    workspace: safeLeadWorkspaceSchema,
});
export const safeLeadDetailSchema = z.object({
    id: z.uuid(),
    workspaceId: z.uuid(),
    name: z
        .string()
        .trim()
        .min(5, 'Name must be at least 5 characters long')
        .max(100, 'Name must be at most 100 characters long'),
    email: emailSchema.optional(),
    phone: z
        .string()
        .refine(isValidPhoneNumber, {
        message: 'Is valid phone number',
    })
        .optional(),
    source: z
        .string()
        .trim()
        .min(10, 'Source must be at least 10 characters long')
        .max(100, 'Source must be at most 100 characters long')
        .optional(),
    stage: z.enum(LeadStage),
    note: z
        .string()
        .trim()
        .min(5, 'Note must be at least 5 characters long')
        .max(200, 'Note must be at most 100 characters long'),
    createdBy: z.uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    taskLinks: z.array(safeTaskSchema),
});
export const safeLeadTaskLinkSchema = z.object({
    leadId: z.uuid(),
    taskId: z.uuid(),
});
export const safeLeadsSchema = z.object({
    data: z.array(safeLeadSchema),
    paginationMeta: paginationMetaSchema
});
export const safeLeadsWithWorkspaceSchema = z.object({
    data: z.array(safeLeadWithWorkspaceSchema),
    paginationMeta: paginationMetaSchema,
});
