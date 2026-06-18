import z from '../../docs/zod.js';
import { emailSchema, safeUserSchema } from '../auth/auth.schemas.js';
import { WorkspaceRole } from '../../../prisma/generated/enums.js';
import {
  dataRangeQuerySchema,
  dateSchema,
  paginationMetaSchema,
  paginationQuerySchema,
  searchQuerySchema,
} from '../../common/schemas/common.schemas.js';

// ========= REQUEST ==========

export const listWorkspaceQuerySchema = dataRangeQuerySchema.safeExtend({
  search: searchQuerySchema,
  ...paginationQuerySchema.shape, 
}).strict();
export type ListWorkspaceQuery = z.infer<typeof listWorkspaceQuerySchema>;

export const listMemberByWorkspaceQuerySchema = dataRangeQuerySchema.safeExtend({
  search: searchQuerySchema,
  ...paginationQuerySchema.shape,
  role: z.enum(WorkspaceRole).optional(),
}).strict();
export type ListMemberByWorkspaceQuery = z.infer<typeof listMemberByWorkspaceQuerySchema>;

export const listInviteeCandidatesQuerySchema = dataRangeQuerySchema.safeExtend({
  search: searchQuerySchema,
  ...paginationQuerySchema.shape,
}).strict();
export type ListInviteeCandidatesQuery = z.infer<typeof listInviteeCandidatesQuerySchema>;

// POST workspace/create
export const createBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must be at most 100 characters long'),
}).strict();
export type CreateWorkspaceBody = z.infer<typeof createBodySchema>;

// Put workspace/:id
export const updateBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must be at most 100 characters long'),
}).strict();
export type UpdateWorkspaceBody = z.infer<typeof updateBodySchema>;

// POST workspace/invite/:id
export const inviteBodySchema = z.object({
  userId: z.uuid(),
  role: z.enum(WorkspaceRole),
}).strict();
export type InviteBody = z.infer<typeof inviteBodySchema>;

// POST workspace/accept_invite
export const acceptBodySchema = z.object({
  token: z.string().trim().min(10, 'Invalid token'),
}).strict();
export type AcceptBody = z.infer<typeof acceptBodySchema>;

// DELETE workspace/remove_member/:workspaceId/:memberId
export const removeMemberBodySchema = z.undefined().or(z.object({}).strict());

// ========= RESPONSE ==========

// POST workspace/create
export const createResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name must be at most 100 characters long'),
  createdBy: z.uuid(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
}).strict();
export type SafeWorkspaceResponse = z.infer<typeof createResponseSchema>;

// Get workspace/list
export const workspaceListItemResponseSchema = createResponseSchema.extend({
  createdByName: z.string(),
  role: z.enum(WorkspaceRole),
});
export type SafeWorkspaceListItemResponse = z.infer<typeof workspaceListItemResponseSchema>;

export const getByUserIdResponseSchema = z.object({
  data: z.array(workspaceListItemResponseSchema),
  paginationMeta: paginationMetaSchema,
}).strict();
export type SafeWorkspacesResponse = z.infer<typeof getByUserIdResponseSchema>;

// Get workspace/:workspaceId
export const getByIdResponseSchema = createResponseSchema.extend({
  createdByName: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name must be at most 100 characters long'),
}).strict();
export type SafeWorkspaceDetailResponse = z.infer<typeof getByIdResponseSchema>;

// Put workspace/:workspaceId
export const updateResponseSchema = createResponseSchema;
export type SafeWorkspaceUpdateResponse = z.infer<typeof updateResponseSchema>;

// DELETE workspace/:workspaceId
export const deleteResponseSchema = createResponseSchema;
export type SafeWorkspaceDeleteResponse = z.infer<typeof deleteResponseSchema>;

export const safeMemberResponseSchema = z.object({
  user: safeUserSchema,
  role: z.enum(WorkspaceRole),
  joinedAt: dateSchema,
}).strict();
export type SafeMemberResponse = z.infer<typeof safeMemberResponseSchema>;

// GET workspace/members/:workspaceId
export const membersResponseSchema = z.object({
  data: z.array(safeMemberResponseSchema),
  paginationMeta: paginationMetaSchema,
}).strict();
export type SafeMembersResponse = z.infer<typeof membersResponseSchema>;

// GET workspace/invitees/:workspaceId
export const inviteCandidatesResponseSchema = z.object({
  data: z.array(safeUserSchema),
  paginationMeta: paginationMetaSchema,
}).strict();
export type InviteCandidatesResponse = z.infer<typeof inviteCandidatesResponseSchema>;

// POST workspace/invite/:workspaceId
export const inviteResponseSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  email: emailSchema,
  role: z.enum(WorkspaceRole),
  jti: z.uuid(),
  tokenHash: z.string().trim().min(10, 'Token hash must be at least 10 characters long').max(100, 'Token hash must be at most 100 characters long'),
  createdAt: dateSchema,
  createdBy: z.uuid(),
}).strict();
export type InviteResponse = z.infer<typeof inviteResponseSchema>;

// POST workspace/accept_invite
export const acceptResponseSchema = z.object({
  role: z.enum(WorkspaceRole),
  userId: z.uuid(),
  workspaceId: z.uuid(),
  joinedAt: dateSchema,
}).strict();
export type AcceptResponse = z.infer<typeof acceptResponseSchema>;

// DELETE workspace/remove_member/:workspaceId/:memberId
export const removeMemberResponseSchema = z.object({
  userId: z.uuid(),
  deletedAt: dateSchema,
  workspaceId: z.uuid(),
  role: z.enum(WorkspaceRole),
  joinedAt: dateSchema,
}).strict();
export type RemoveMemberResponse = z.infer<typeof removeMemberResponseSchema>;
