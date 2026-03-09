import { acceptResponseSchema, createResponseSchema, deleteResponseSchema, getByIdResponseSchema, getByUserIdResponseSchema, inviteResponseSchema, membersResponseSchema, removeMemberResponseSchema, updateResponseSchema } from './workspace.schemas.js';
import { validateResponse } from '../../common/utils/response/validate.js';
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from '../../common/utils/response/format.js';
export class WorkspaceController {
    constructor(workspaceService) {
        this.workspaceService = workspaceService;
        this.create = async (req, res) => {
            const workspace = await this.workspaceService.create(req.body, req.user.id);
            const workspaceResponse = {
                id: workspace.id,
                name: workspace.name,
                createdBy: workspace.createdBy,
                createdAt: workspace.createdAt,
                updatedAt: workspace.updatedAt
            };
            const envelop = created(workspaceResponse);
            const envelopSchema = createdEnvelopeSchema(createResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
        };
        this.getById = async (req, res) => {
            const workspace = await this.workspaceService.getById(req.params.workspaceId, req.user.id);
            const workspaceResponse = {
                id: workspace.id,
                name: workspace.name,
                createdBy: workspace.createdBy,
                createdAt: workspace.createdAt,
                updatedAt: workspace.updatedAt
            };
            const envelop = ok(workspaceResponse);
            const envelopSchema = okEnvelopeSchema(getByIdResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.getByUserId = async (req, res) => {
            const workspaces = await this.workspaceService.getByUserId(req.user.id);
            const workspacesResponse = workspaces.map((w) => ({
                id: w.id,
                name: w.name,
                createdBy: w.createdBy,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt
            }));
            const envelop = ok(workspacesResponse);
            const envelopSchema = okEnvelopeSchema(getByUserIdResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.getMembersById = async (req, res) => {
            const members = await this.workspaceService.listMembers(req.params.workspaceId, req.user.id);
            const membersResponse = members.map((m) => ({
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
        this.update = async (req, res) => {
            const updateData = { name: req.body.name };
            const result = await this.workspaceService.update(req.params.workspaceId, updateData, req.user.id);
            const safeWorkspaceResponse = {
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
        this.remove = async (req, res) => {
            const result = await this.workspaceService.delete(req.params.workspaceId, req.user.id);
            const safeWorkspaceResponse = {
                id: result.id,
                name: result.name,
                createdBy: result.createdBy,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt
            };
            const envelop = ok(safeWorkspaceResponse);
            const envelopSchema = okEnvelopeSchema(deleteResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.invinte = async (req, res) => {
            const result = await this.workspaceService.inviteMember(req.params.workspaceId, req.body.inviteeId, req.body.role, req.user.id);
            const inviteResponse = {
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
        this.accept = async (req, res) => {
            const result = await this.workspaceService.acceptInvite(req.body.token, req.user.id);
            const acceptResponse = {
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
        this.removeMember = async (req, res) => {
            const result = await this.workspaceService.removeMember(req.params.workspaceId, req.params.memberId, req.user.id);
            const removeMemberResponse = {
                userId: result.userId,
                deletedAt: result.deletedAt,
                workspaceId: result.workspaceId,
                role: result.role,
                joinedAt: result.joinedAt
            };
            const envelop = ok(removeMemberResponse);
            const envelopSchema = okEnvelopeSchema(removeMemberResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
    }
}
