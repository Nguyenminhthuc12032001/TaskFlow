import { Request, Response } from 'express';
import type { WorkspaceService } from './workspace.service.js';
import {
  acceptResponseSchema,
  createResponseSchema,
  deleteResponseSchema,
  getByIdResponseSchema,
  getByUserIdResponseSchema,
  inviteCandidatesResponseSchema,
  inviteResponseSchema,
  membersResponseSchema,
  removeMemberResponseSchema,
  safeMemberResponseSchema,
  updateResponseSchema,
  type AcceptBody,
  type AcceptResponse,
  type CreateWorkspaceBody,
  type InviteBody,
  type InviteCandidatesResponse,
  type InviteResponse,
  type RemoveMemberResponse,
  type SafeWorkspaceDetailResponse,
  type SafeMemberResponse,
  type SafeMembersResponse,
  type SafeWorkspaceResponse,
  type SafeWorkspacesResponse,
  type UpdateWorkspaceBody,
  type ListWorkspaceQuery,
  listWorkspaceQuerySchema,
  type ListMemberByWorkspaceQuery,
  listMemberByWorkspaceQuerySchema,
  type ListInviteeCandidatesQuery,
  listInviteeCandidatesQuerySchema,
} from './workspace.schemas.js';
import { validateResponse } from '../../common/utils/response/validate.js';
import {
  created,
  createdEnvelopeSchema,
  ok,
  okEnvelopeSchema,
} from '../../common/utils/response/format.js';
import type { WorkspaceParamsType } from '../../common/schemas/common.schemas.js';

export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  create = async (req: Request<{}, {}, CreateWorkspaceBody>, res: Response): Promise<Response> => {
    const workspace = await this.workspaceService.create(req.body, req.user!.id);

    const workspaceResponse: SafeWorkspaceResponse = {
      id: workspace.id,
      name: workspace.name,
      createdBy: workspace.createdBy,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };

    const envelope = created(workspaceResponse);
    const envelopeSchema = createdEnvelopeSchema(createResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(201).json(validatedEnvelope);
  };

  getById = async (req: Request<WorkspaceParamsType>, res: Response): Promise<Response> => {
    const workspace = await this.workspaceService.getById(req.params.workspaceId);

    const workspaceResponse: SafeWorkspaceDetailResponse = {
      id: workspace.id,
      name: workspace.name,
      createdBy: workspace.createdBy,
      createdByName: workspace.creator.name,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };

    const envelope = ok(workspaceResponse);
    const envelopeSchema = okEnvelopeSchema(getByIdResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  getByUserId = async (req: Request, res: Response): Promise<Response> => {
    const listWorkspaceQuery: ListWorkspaceQuery = listWorkspaceQuerySchema.parse(req.query);

    const { workspaces, paginationMeta } = await this.workspaceService.getByUserId(
      req.user!.id,
      listWorkspaceQuery,
    );

    const workspacesResponse: SafeWorkspacesResponse = {
      data: workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        createdBy: w.createdBy,
        createdByName: w.creator.name,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        role: w.members[0].role,
      })),
      paginationMeta,
    };

    const envelope = ok(workspacesResponse);
    const envelopeSchema = okEnvelopeSchema(getByUserIdResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  getMembersById = async (req: Request<WorkspaceParamsType>, res: Response): Promise<Response> => {
    const listMemberByWorkspaceQuery: ListMemberByWorkspaceQuery =
      listMemberByWorkspaceQuerySchema.parse(req.query);

    const { members, paginationMeta } = await this.workspaceService.listMembers(
      req.params.workspaceId,
      listMemberByWorkspaceQuery,
    );

    const membersResponse: SafeMembersResponse = {
      data: members.map((m: SafeMemberResponse) => ({
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
        },
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      paginationMeta,
    };

    const envelope = ok(membersResponse);
    const envelopeSchema = okEnvelopeSchema(membersResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  getMemberByUserId = async (
    req: Request<WorkspaceParamsType>,
    res: Response,
  ): Promise<Response> => {
    const member = await this.workspaceService.getMemberByUserId(
      req.params.workspaceId,
      req.user!.id,
    );

    const memberResponse: SafeMemberResponse = {
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      },
      role: member.role,
      joinedAt: member.joinedAt,
    };

    const envelope = ok(memberResponse);
    const envelopeSchema = okEnvelopeSchema(safeMemberResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  getInviteCandidates = async (
    req: Request<WorkspaceParamsType>,
    res: Response,
  ): Promise<Response> => {
    const listInviteeCandidatesQuery: ListInviteeCandidatesQuery =
      listInviteeCandidatesQuerySchema.parse(req.query);

    const { users, paginationMeta } = await this.workspaceService.listInviteCandidates(
      req.params.workspaceId,
      listInviteeCandidatesQuery,
    );

    const inviteCandidatesResponse: InviteCandidatesResponse = {
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),
      paginationMeta,
    };

    const envelope = ok(inviteCandidatesResponse);
    const envelopeSchema = okEnvelopeSchema(inviteCandidatesResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  update = async (
    req: Request<WorkspaceParamsType, {}, UpdateWorkspaceBody>,
    res: Response,
  ): Promise<Response> => {
    const updateData: UpdateWorkspaceBody = { name: req.body.name };
    const result = await this.workspaceService.update(
      req.params.workspaceId,
      updateData,
      req.user!.id,
    );

    const safeWorkspaceResponse: SafeWorkspaceResponse = {
      id: result.id,
      name: result.name,
      createdBy: result.createdBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    const envelope = ok(safeWorkspaceResponse);
    const envelopeSchema = okEnvelopeSchema(updateResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  remove = async (req: Request<WorkspaceParamsType>, res: Response): Promise<Response> => {
    const result = await this.workspaceService.delete(req.params.workspaceId, req.user!.id);

    const safeWorkspaceResponse: SafeWorkspaceResponse = {
      id: result.id,
      name: result.name,
      createdBy: result.createdBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    const envelope = ok(safeWorkspaceResponse);
    const envelopeSchema = okEnvelopeSchema(deleteResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  invinte = async (
    req: Request<WorkspaceParamsType, {}, InviteBody>,
    res: Response,
  ): Promise<Response> => {
    const result = await this.workspaceService.inviteMember(
      req.params.workspaceId,
      req.body.userId,
      req.body.role,
      req.user!.id,
    );

    const inviteResponse: InviteResponse = {
      id: result.id,
      workspaceId: result.workspaceId,
      email: result.email,
      role: result.role,
      jti: result.jti,
      tokenHash: result.tokenHash,
      createdAt: result.createdAt,
      createdBy: result.createdBy,
    };

    const envelope = ok(inviteResponse);
    const envelopeSchema = okEnvelopeSchema(inviteResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  accept = async (req: Request<{}, {}, AcceptBody>, res: Response): Promise<Response> => {
    const result = await this.workspaceService.acceptInvite(req.body.token, req.user!.id);

    const acceptResponse: AcceptResponse = {
      role: result.role,
      userId: result.userId,
      workspaceId: result.workspaceId,
      joinedAt: result.joinedAt,
    };

    const envelope = created(acceptResponse);
    const envelopeSchema = createdEnvelopeSchema(acceptResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(201).json(validatedEnvelope);
  };

  removeMember = async (req: Request<WorkspaceParamsType>, res: Response): Promise<Response> => {
    const result = await this.workspaceService.removeMember(
      req.params.workspaceId,
      req.params.memberId!,
      req.user!.id,
    );

    const removeMemberResponse: RemoveMemberResponse = {
      userId: result.userId,
      deletedAt: result.deletedAt!,
      workspaceId: result.workspaceId,
      role: result.role,
      joinedAt: result.joinedAt,
    };

    const envelope = ok(removeMemberResponse);
    const envelopeSchema = okEnvelopeSchema(removeMemberResponseSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  changeRole = async (_req: Request, res: Response): Promise<Response> => {
    return res.status(501).json({ message: 'Not implemented' });
  };
}
