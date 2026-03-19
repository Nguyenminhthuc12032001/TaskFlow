import z from "../../docs/zod.js";
import { safeUserSchema } from "../auth/auth.schemas.js";
import { WorkspaceRole } from "../../../prisma/generated/enums.js";

// ========= REQUEST ==========

// POST workspace/create
export const createBodySchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
});
export type CreateWorkspaceBody = z.infer<typeof createBodySchema>;

// Put workspace/:id
export const updateBodySchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must be at most 100 characters long"),
});
export type UpdateWorkspaceBody = z.infer<typeof updateBodySchema>;

// POST workspace/invite/:id
export const inviteBodySchema = z.object({
    inviteeId: z.uuid(),
    role: z.enum(WorkspaceRole)
});
export type InviteBody = z.infer<typeof inviteBodySchema>;

// POST workspace/accept_invite
export const acceptBodySchema = z.object({
    token: z.string()
});
export type AcceptBody = z.infer<typeof acceptBodySchema>;

// DELETE workspace/remove_member/:workspaceId/:memberId
export const removeMemberBodySchema = z.undefined()
    .or(z.object({}).strict());
    
// ========= RESPONSE ==========

// POST workspace/create
export const createResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    createdBy: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export type SafeWorkspaceResponse = z.infer<typeof createResponseSchema>;

// Get workspace/list
export const getByUserIdResponseSchema = z.array(createResponseSchema);
export type SafeWorkspacesResponse = z.infer<typeof getByUserIdResponseSchema>;

// Get workspace/:workspaceId
export const getByIdResponseSchema = createResponseSchema;

// Put workspace/:workspaceId
export const updateResponseSchema = createResponseSchema;

// DELETE workspace/:workspaceId
export const deleteResponseSchema = createResponseSchema;

export const safeMemberResponseSchema = z.object({
    user: safeUserSchema,
    role: z.enum(WorkspaceRole),
    joinedAt: z.date()
});
export type SafeMemberResponse = z.infer<typeof safeMemberResponseSchema>;

// GET workspace/members/:workspaceId
export const membersResponseSchema = z.array(safeMemberResponseSchema);
export type SafeMembersResponse = z.infer<typeof membersResponseSchema>;

// POST workspace/invite/:workspaceId
export const inviteResponseSchema = z.object({
    id: z.string(),
    workspaceId: z.uuid(),
    email: z.string(),
    role: z.enum(WorkspaceRole),
    jti: z.string(),
    tokenHash: z.string(),
    createdAt: z.date(),
    createdBy: z.uuid(),
});
export type InviteResponse = z.infer<typeof inviteResponseSchema>;


// POST workspace/accept_invite
export const acceptResponseSchema = z.object({
    role: z.enum(WorkspaceRole),
    userId: z.uuid(),
    workspaceId: z.uuid(),
    joinedAt: z.date(),
});
export type AcceptResponse = z.infer<typeof acceptResponseSchema>;

// DELETE workspace/remove_member/:workspaceId/:memberId
export const removeMemberResponseSchema = z.object({
    userId: z.uuid(),
    deletedAt: z.date(),
    workspaceId: z.uuid(),
    role: z.enum(WorkspaceRole),
    joinedAt: z.date()
});
export type RemoveMemberResponse = z.infer<typeof removeMemberResponseSchema>;
