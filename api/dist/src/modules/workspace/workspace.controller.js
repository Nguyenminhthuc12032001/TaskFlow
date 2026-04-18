import { acceptResponseSchema, createResponseSchema, deleteResponseSchema, getByIdResponseSchema, getByUserIdResponseSchema, inviteResponseSchema, membersResponseSchema, removeMemberResponseSchema, safeMemberResponseSchema, updateResponseSchema, } from './workspace.schemas.js';
import { validateResponse } from '../../common/utils/response/validate.js';
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema, } from '../../common/utils/response/format.js';
import { paginationQuerySchema } from '../../common/schemas/common.schemas.js';
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
                updatedAt: workspace.updatedAt,
            };
            const envelope = created(workspaceResponse);
            const envelopeSchema = createdEnvelopeSchema(createResponseSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(201).json(validatedEnvelope);
        };
        this.getById = async (req, res) => {
            const workspace = await this.workspaceService.getById(req.params.workspaceId);
            const workspaceResponse = {
                id: workspace.id,
                name: workspace.name,
                createdBy: workspace.createdBy,
                createdAt: workspace.createdAt,
                updatedAt: workspace.updatedAt,
            };
            const envelope = ok(workspaceResponse);
            const envelopeSchema = okEnvelopeSchema(getByIdResponseSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.getByUserId = async (req, res) => {
            const paginationQuery = paginationQuerySchema.parse(req.query);
            const { workspaces, paginationMeta } = await this.workspaceService.getByUserId(req.user.id, paginationQuery);
            const workspacesResponse = {
                data: workspaces.map((w) => ({
                    id: w.id,
                    name: w.name,
                    createdBy: w.createdBy,
                    createdAt: w.createdAt,
                    updatedAt: w.updatedAt,
                })),
                paginationMeta
            };
            const envelope = ok(workspacesResponse);
            const envelopeSchema = okEnvelopeSchema(getByUserIdResponseSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.getMembersById = async (req, res) => {
            const paginationQuery = paginationQuerySchema.parse(req.query);
            const { members, paginationMeta } = await this.workspaceService.listMembers(req.params.workspaceId, paginationQuery);
            const membersResponse = {
                data: members.map((m) => ({
                    user: {
                        id: m.user.id,
                        name: m.user.name,
                        email: m.user.email,
                    },
                    role: m.role,
                    joinedAt: m.joinedAt,
                })),
                paginationMeta
            };
            const envelope = ok(membersResponse);
            const envelopeSchema = okEnvelopeSchema(membersResponseSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.getMemberByUserId = async (req, res) => {
            const member = await this.workspaceService.getMemberByUserId(req.params.workspaceId, req.user.id);
            const memberResponse = {
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
        this.update = async (req, res) => {
            const updateData = { name: req.body.name };
            const result = await this.workspaceService.update(req.params.workspaceId, updateData, req.user.id);
            const safeWorkspaceResponse = {
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
        this.remove = async (req, res) => {
            const result = await this.workspaceService.delete(req.params.workspaceId, req.user.id);
            const safeWorkspaceResponse = {
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
        this.invinte = async (req, res) => {
            const result = await this.workspaceService.inviteMember(req.params.workspaceId, req.body.email, req.body.role, req.user.id);
            const inviteResponse = {
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
        this.accept = async (req, res) => {
            const result = await this.workspaceService.acceptInvite(req.body.token, req.user.id);
            const acceptResponse = {
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
        this.removeMember = async (req, res) => {
            const result = await this.workspaceService.removeMember(req.params.workspaceId, req.params.memberId, req.user.id);
            const removeMemberResponse = {
                userId: result.userId,
                deletedAt: result.deletedAt,
                workspaceId: result.workspaceId,
                role: result.role,
                joinedAt: result.joinedAt,
            };
            const envelope = ok(removeMemberResponse);
            const envelopeSchema = okEnvelopeSchema(removeMemberResponseSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.changeRole = async (req, res) => { };
    }
}
