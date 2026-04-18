import { randomUUID } from 'node:crypto';
import { ActivityAction, } from '../../../prisma/generated/client.js';
import { AppError } from '../../common/errors/AppError.js';
import { signInviteToken, verifyInviteToken, } from '../../common/utils/jwt.js';
import { env } from '../../config/env.js';
import ms from 'ms';
import { log } from '../../common/logger/logger.js';
import { hashValue, verifyHash } from '../../common/utils/crypto.js';
import { buildPagination, buildPaginationMeta } from '../../common/utils/pagination.js';
export class WorkspaceService {
    constructor(emailService, workspaceRepo, authRepo, projectRepo, activityService, prisma) {
        this.emailService = emailService;
        this.workspaceRepo = workspaceRepo;
        this.authRepo = authRepo;
        this.projectRepo = projectRepo;
        this.activityService = activityService;
        this.prisma = prisma;
    }
    async create(workspaceData, actorId) {
        const workspaces = await this.workspaceRepo.findAllByUserId(actorId);
        if (workspaces.some((w) => w.name === workspaceData.name)) {
            throw new AppError('Workspace name already exists', 409);
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const newWorkspace = {
                name: workspaceData.name,
                creator: { connect: { id: actorId } },
            };
            const workspace = await this.workspaceRepo.create(newWorkspace, tx);
            const newWorkspaceMember = {
                user: { connect: { id: actorId } },
                workspace: { connect: { id: workspace.id } },
                role: 'owner',
            };
            await this.workspaceRepo.createMembership(newWorkspaceMember, tx);
            await this.activityService.logActivity(workspace.id, ActivityAction.CREATE_WORKSPACE, 'workspace', actorId, workspace.id, { name: workspace.name }, tx);
            return workspace;
        });
        return result;
    }
    async getById(workspaceId) {
        const workspace = await this.workspaceRepo.findById(workspaceId);
        if (!workspace) {
            throw new AppError('Workspace not found or access denied', 404);
        }
        return workspace;
    }
    async getByUserId(actorId, paginationQuery) {
        const { safePage, safeLimit, take, skip } = buildPagination(paginationQuery.page, paginationQuery.limit);
        const workspaces = await this.workspaceRepo.findByUserId(actorId, { take, skip });
        const countWorkspacesByUser = await this.workspaceRepo.countWorkspacesByUserId(actorId);
        const paginationMeta = buildPaginationMeta(safePage, safeLimit, countWorkspacesByUser);
        return { workspaces, paginationMeta };
    }
    async listMembers(workspaceId, paginationQuery) {
        const { safePage, safeLimit, take, skip } = buildPagination(paginationQuery.page, paginationQuery.limit);
        const members = await this.workspaceRepo.findMembers(workspaceId, { take, skip });
        const countWorkspaceMembers = await this.workspaceRepo.countWorkspaceMembers(workspaceId);
        const paginationMeta = buildPaginationMeta(safePage, safeLimit, countWorkspaceMembers);
        return { members, paginationMeta };
    }
    async getMemberByUserId(workspaceId, actorId) {
        const member = await this.workspaceRepo.findMembership(workspaceId, actorId);
        if (!member) {
            throw new AppError('Member not found', 404);
        }
        return member;
    }
    async update(workspaceId, workspaceData, actorId) {
        const workspaces = await this.workspaceRepo.findAllByUserId(actorId);
        if (workspaces.some((w) => w.name === workspaceData.name && w.id !== workspaceId)) {
            throw new AppError('Workspace name already exists', 409);
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const workspace = await this.workspaceRepo.update(workspaceId, workspaceData, tx);
            await this.activityService.logActivity(workspaceId, ActivityAction.UPDATE_WORKSPACE, 'workspace', actorId, workspaceId, { name: workspaceData.name }, tx);
            return workspace;
        });
        return result;
    }
    async delete(workspaceId, actorId) {
        const result = await this.prisma.$transaction(async (tx) => {
            await this.activityService.logActivity(workspaceId, ActivityAction.DELETE_WORKSPACE, 'workspace', actorId, workspaceId, { id: workspaceId }, tx);
            const workspace = await this.workspaceRepo.delete(workspaceId, tx);
            return workspace;
        });
        return result;
    }
    async inviteMember(workspaceId, email, role, actorId) {
        const result = await this.prisma.$transaction(async (tx) => {
            const actor = await this.workspaceRepo.findMembership(workspaceId, actorId);
            if (!actor) {
                throw new AppError('Workspace not found or access denied', 404);
            }
            if (!['admin', 'owner'].includes(actor.role)) {
                throw new AppError('Forbidden', 403);
            }
            const existInvitee = await this.authRepo.findUserByEmail(email, tx);
            if (!existInvitee) {
                throw new AppError('Invitee with the provided ID does not exist', 404);
            }
            const existingMembership = await this.workspaceRepo.findMembership(workspaceId, existInvitee.id, tx);
            if (existingMembership) {
                throw new AppError('User is already a member of the workspace', 409);
            }
            const existingInvite = await this.workspaceRepo.findInviteByEmail(workspaceId, existInvitee.email, tx);
            if (existingInvite) {
                throw new AppError('An invite has already been sent to this email for the workspace', 409);
            }
            const workspace = await this.workspaceRepo.findById(workspaceId, tx);
            if (!workspace) {
                throw new AppError('Workspace not found', 404);
            }
            if (role === 'owner') {
                throw new AppError('Cannot invite owner', 400);
            }
            if (actor.role === 'admin' && role === 'admin') {
                throw new AppError('Forbidden', 403);
            }
            const tokenJti = randomUUID();
            const token = signInviteToken({
                inviteeId: existInvitee.id,
                jti: tokenJti,
                email: existInvitee.email,
                workspaceId: workspace.id,
                role: role,
            });
            const data = {
                email: existInvitee.email,
                role: role,
                tokenHash: await hashValue(token),
                jti: tokenJti,
                expiresAt: new Date(Date.now() + ms(env.TTL_INVITE_TOKEN)),
                workspace: { connect: { id: workspace.id } },
                creator: { connect: { id: actorId } },
            };
            const invite = await this.workspaceRepo.inviteMembership(data, tx);
            await this.activityService.logActivity(workspaceId, ActivityAction.INVITE_MEMBER, 'invite', actorId, invite.id, { email: invite.email, role: invite.role }, tx);
            return { invite, token, workspace };
        });
        const inviteLink = `${env.FRONTEND_URL}/accept-invite?token=${encodeURIComponent(result.token)}`;
        try {
            await this.emailService.sendInviteEmail(result.invite.email, result.workspace.name, inviteLink);
            log.info({
                workspaceId,
                inviteId: result.invite.id,
                inviteeEmail: result.invite.email,
                actorId,
            }, 'Invite email sent');
        }
        catch (error) {
            log.error({
                workspaceId,
                inviteId: result.invite.id,
                inviteeEmail: result.invite.email,
                actorId,
                err: error,
            }, 'Failed to send invite email');
            throw error;
        }
        log.info({ email }, 'Invited member for workspace successfully');
        return result.invite;
    }
    async acceptInvite(token, actorId) {
        let payload;
        try {
            payload = verifyInviteToken(token);
        }
        catch (error) {
            log.warn({ actorId }, 'Accept invite failed: invalid token');
            throw new AppError('Invalid invite token', 401);
        }
        if (payload.inviteeId !== actorId) {
            throw new AppError('Invalid invite token', 403);
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const invite = await this.workspaceRepo.findInviteByJti(payload.jti, tx);
            if (!invite) {
                throw new AppError('Invite not found or already used', 404);
            }
            if (!(await verifyHash(token, invite.tokenHash))) {
                throw new AppError('Invalid invite token', 401);
            }
            const existMembership = await this.workspaceRepo.findMembership(payload.workspaceId, actorId, tx);
            if (existMembership) {
                throw new AppError('You are already a member', 409);
            }
            const newMembershipDate = {
                role: invite.role,
                joinedAt: new Date(),
                workspace: { connect: { id: invite.workspaceId } },
                user: { connect: { id: actorId } },
            };
            const newMembership = await this.workspaceRepo.createMembership(newMembershipDate, tx);
            const markInviteUsed = await this.workspaceRepo.markInviteUsed(payload.jti, tx);
            if (markInviteUsed.count === 0) {
                throw new AppError('Invite already used or expired', 400);
            }
            await this.activityService.logActivity(invite.workspaceId, ActivityAction.ACCEPT_INVITE, 'invite', actorId, invite.id, { email: invite.email, role: invite.role }, tx);
            return newMembership;
        });
        log.info({ id: result.userId, role: result.role }, 'Accepted member successfully');
        return result;
    }
    async removeMember(workspaceId, memberId, actorId) {
        if (actorId !== memberId) {
            const actor = await this.workspaceRepo.findMembership(workspaceId, actorId);
            if (!actor) {
                throw new AppError('Workspace not found or access denied', 404);
            }
            if (!['admin', 'owner'].includes(actor.role)) {
                throw new AppError('Forbidden', 403);
            }
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const member = await this.workspaceRepo.deleteMembership(workspaceId, memberId, tx);
            await this.activityService.logActivity(workspaceId, ActivityAction.REMOVE_MEMBER, 'workspace_member', actorId, memberId, { memberId: member.userId, role: member.role }, tx);
            return member;
        });
        log.info({ id: result.userId, role: result.role }, 'Removed member successfully');
        return result;
    }
}
