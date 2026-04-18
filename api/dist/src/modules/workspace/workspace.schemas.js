import z from '../../docs/zod.js';
import { emailSchema, safeUserSchema } from '../auth/auth.schemas.js';
import { WorkspaceRole } from '../../../prisma/generated/enums.js';
import { paginationMetaSchema } from '../../common/schemas/common.schemas.js';
// ========= REQUEST ==========
// POST workspace/create
export const createBodySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters long')
        .max(100, 'Name must be at most 100 characters long'),
});
// Put workspace/:id
export const updateBodySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters long')
        .max(100, 'Name must be at most 100 characters long'),
});
// POST workspace/invite/:id
export const inviteBodySchema = z.object({
    email: emailSchema,
    role: z.enum(WorkspaceRole),
});
// POST workspace/accept_invite
export const acceptBodySchema = z.object({
    token: z.string(),
});
// DELETE workspace/remove_member/:workspaceId/:memberId
export const removeMemberBodySchema = z.undefined().or(z.object({}).strict());
// ========= RESPONSE ==========
// POST workspace/create
export const createResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    createdBy: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});
// Get workspace/list
export const getByUserIdResponseSchema = z.object({
    data: z.array(createResponseSchema),
    paginationMeta: paginationMetaSchema,
});
// Get workspace/:workspaceId
export const getByIdResponseSchema = createResponseSchema;
// Put workspace/:workspaceId
export const updateResponseSchema = createResponseSchema;
// DELETE workspace/:workspaceId
export const deleteResponseSchema = createResponseSchema;
export const safeMemberResponseSchema = z.object({
    user: safeUserSchema,
    role: z.enum(WorkspaceRole),
    joinedAt: z.coerce.date(),
});
// GET workspace/members/:workspaceId
export const membersResponseSchema = z.object({
    data: z.array(safeMemberResponseSchema),
    paginationMeta: paginationMetaSchema,
});
// POST workspace/invite/:workspaceId
export const inviteResponseSchema = z.object({
    id: z.string(),
    workspaceId: z.uuid(),
    email: z.string(),
    role: z.enum(WorkspaceRole),
    jti: z.string(),
    tokenHash: z.string(),
    createdAt: z.coerce.date(),
    createdBy: z.uuid(),
});
// POST workspace/accept_invite
export const acceptResponseSchema = z.object({
    role: z.enum(WorkspaceRole),
    userId: z.uuid(),
    workspaceId: z.uuid(),
    joinedAt: z.coerce.date(),
});
// DELETE workspace/remove_member/:workspaceId/:memberId
export const removeMemberResponseSchema = z.object({
    userId: z.uuid(),
    deletedAt: z.coerce.date(),
    workspaceId: z.uuid(),
    role: z.enum(WorkspaceRole),
    joinedAt: z.coerce.date(),
});
