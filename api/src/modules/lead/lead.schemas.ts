import { LeadStage, Prisma, TaskPriority } from '../../../prisma/generated/client.js';
import z from '../../docs/zod.js';
import { emailSchema } from '../auth/auth.schemas.js';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { safeTaskSchema } from '../task/task.schemas.js';

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
export type CreateBodyType = z.infer<typeof createBodySchema>;

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
export type UpdateBodyType = z.infer<typeof updateBodySchema>;

export const updateStageBodySchema = z.object({
  stage: z.enum(LeadStage),
});
export type UpdateStageBodyType = z.infer<typeof updateStageBodySchema>;

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
export type CreateFollowUpBodyType = z.infer<typeof createFollowUpTaskBodySchema>;

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
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SafeLeadType = z.infer<typeof safeLeadSchema>;

export const safeLeadTaskLinkSchema = z.object({
  leadId: z.uuid(),
  taskId: z.uuid(),
});
export type SafeLeadTaskLinkType = z.infer<typeof safeLeadTaskLinkSchema>;

export const safeLeadsSchema = z.array(safeLeadSchema);
export type SafeLeadsType = z.infer<typeof safeLeadsSchema>;
