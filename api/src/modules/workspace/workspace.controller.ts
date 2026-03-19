import { Request, Response } from 'express';
import type { WorkspaceService } from './workspace.service.js';
import { acceptResponseSchema, createResponseSchema, deleteResponseSchema, getByIdResponseSchema, getByUserIdResponseSchema, inviteResponseSchema, membersResponseSchema, removeMemberResponseSchema, updateResponseSchema, type AcceptBody, type AcceptResponse, type CreateWorkspaceBody, type InviteBody, type InviteResponse, type RemoveMemberResponse, type SafeMemberResponse, type SafeMembersResponse, type SafeWorkspaceResponse, type SafeWorkspacesResponse, type UpdateWorkspaceBody } from './workspace.schemas.js';
import { validateResponse } from '../../common/utils/response/validate.js';
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from '../../common/utils/response/format.js';
import type { WorkspaceParams } from '../../common/middlewares/requireWorkspaceRole.middleware.js';

export class WorkspaceController {
    constructor(
        private workspaceService: WorkspaceService
    ) { }

    create = async (req: Request<{}, {}, CreateWorkspaceBody>, res: Response) => {
        const workspace = await this.workspaceService.create(req.body, req.user!.id);

        const workspaceResponse: SafeWorkspaceResponse = {
            id: workspace.id,
            name: workspace.name,
            createdBy: workspace.createdBy,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt
        }

        const envelop = created(workspaceResponse);
        const envelopSchema = createdEnvelopeSchema(createResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(201).json(validatedEnvelop);
    };

    getById = async (req: Request<WorkspaceParams>, res: Response) => {
        const workspace = await this.workspaceService.getById(req.params.workspaceId);

        const workspaceResponse: SafeWorkspaceResponse = {
            id: workspace.id,
            name: workspace.name,
            createdBy: workspace.createdBy,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt
        }

        const envelop = ok(workspaceResponse);
        const envelopSchema = okEnvelopeSchema(getByIdResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    getByUserId = async (req: Request, res: Response) => {
        const workspaces = await this.workspaceService.getByUserId(req.user!.id);

        const workspacesResponse: SafeWorkspacesResponse = workspaces.map((w) => ({
            id: w.id,
            name: w.name,
            createdBy: w.createdBy,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt
        }))

        const envelop = ok(workspacesResponse);
        const envelopSchema = okEnvelopeSchema(getByUserIdResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop)
    };

    getMembersById = async (req: Request<WorkspaceParams>, res: Response) => {
        const members = await this.workspaceService.listMembers(req.params.workspaceId);

        const membersResponse: SafeMembersResponse = members.map((m: SafeMemberResponse) => ({
            user: {
                id: m.user.id,
                name: m.user.name,
                email: m.user.email
            },
            role: m.role,
            joinedAt: m.joinedAt
        }));

        const envelop = ok(membersResponse);
        const envelopSchema = okEnvelopeSchema(membersResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    update = async (req: Request<WorkspaceParams, {}, UpdateWorkspaceBody>, res: Response) => {
        const updateData: UpdateWorkspaceBody = { name: req.body.name };
        const result = await this.workspaceService.update(req.params.workspaceId, updateData, req.user!.id);

        const safeWorkspaceResponse: SafeWorkspaceResponse = {
            id: result.id,
            name: result.name,
            createdBy: result.createdBy,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
        };

        const envelop = ok(safeWorkspaceResponse);
        const envelopSchema = okEnvelopeSchema(updateResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    remove = async (req: Request<WorkspaceParams>, res: Response) => {
        const result = await this.workspaceService.delete(req.params.workspaceId, req.user!.id);

        const safeWorkspaceResponse: SafeWorkspaceResponse = {
            id: result.id,
            name: result.name,
            createdBy: result.createdBy,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt
        }

        const envelop = ok(safeWorkspaceResponse);
        const envelopSchema = okEnvelopeSchema(deleteResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    invinte = async (req: Request<WorkspaceParams, {}, InviteBody>, res: Response) => {
        const result = await this.workspaceService.inviteMember(
            req.params.workspaceId,
            req.body.inviteeId,
            req.body.role,
            req.user!.id
        );

        const inviteResponse: InviteResponse = {
            id: result.id,
            workspaceId: result.workspaceId,
            email: result.email,
            role: result.role,
            jti: result.jti,
            tokenHash: result.tokenHash,
            createdAt: result.createdAt,
            createdBy: result.createdBy
        };

        const envelop = ok(inviteResponse);
        const envelopShcema = okEnvelopeSchema(inviteResponseSchema);
        const validatedEnvelop = validateResponse(envelopShcema)(envelop);
        
        return res.status(200).json(validatedEnvelop);
    };

    accept = async (req: Request<{}, {}, AcceptBody>, res: Response) => {
        const result = await this.workspaceService.acceptInvite(req.body.token, req.user!.id);

        const acceptResponse: AcceptResponse = {
            role: result.role,
            userId: result.userId,
            workspaceId: result.workspaceId,
            joinedAt: result.joinedAt
        };

        const envelop = created(acceptResponse);
        const envelopSchema = createdEnvelopeSchema(acceptResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(201).json(validatedEnvelop);
    };

    removeMember = async (req: Request<WorkspaceParams>, res: Response) => {
        const result = await this.workspaceService.removeMember(
            req.params.workspaceId, 
            req.params.memberId!, 
            req.user!.id);
        
        const removeMemberResponse: RemoveMemberResponse = {
            userId: result.userId,
            deletedAt: result.deletedAt!,
            workspaceId: result.workspaceId,
            role: result.role,
            joinedAt: result.joinedAt
        };

        const envelop = ok(removeMemberResponse);
        const envelopSchema = okEnvelopeSchema(removeMemberResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    changeRole = async (req: Request, res: Response) => {};
}