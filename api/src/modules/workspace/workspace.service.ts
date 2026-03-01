import { randomUUID } from "node:crypto";
import { ActivityAction, type Prisma, type WorkspaceRole } from "../../../prisma/generated/client.js";
import { AppError } from "../../common/errors/AppError.js";
import { signInviteToken, verifyInviteToken, type InviteTokenPayload } from "../../common/utils/jwt.js";
import { prisma } from "../../db/prisma.js";
import { activityService } from "../activity/activity.service.js";
import { workspaceRepo } from "./workspace.repo.js";
import type { CreateWorkspaceBody, SafeWorkspaceResponse, UpdateWorkspaceBody } from "./workspace.schemas.js";
import { authRepo } from "../auth/auth.repo.js";
import { env } from "../../config/env.js";
import ms from "ms";
import { sendInviteEmail } from "../mail/mail.service.js";
import { log } from "../../common/logger/logger.js";
import { hash } from "../../common/utils/crypto.js";

export const workspaceService = {
    async create(workspaceData: CreateWorkspaceBody, userId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const newWorkspace: Prisma.WorkspaceCreateInput = {
                name: workspaceData.name,
                creator: { connect: { id: userId } }
            }
            const workspace = await workspaceRepo.create(newWorkspace, tx);

            const newWorkspaceMember: Prisma.WorkspaceMemberCreateInput = {
                user: { connect: { id: userId } },
                workspace: { connect: { id: workspace.id } },
                role: "owner"
            }
            await workspaceRepo.createMembership(newWorkspaceMember, tx);

            await activityService.logActivity(
                workspace.id,
                ActivityAction.CREATE_WORKSPACE,
                "workspace",
                userId,
                workspace.id,
                { name: workspace.name },
                tx
            )

            const safeWorkspace: SafeWorkspaceResponse = {
                id: workspace.id,
                name: workspace.name,
                createdBy: workspace.createdBy,
                createdAt: workspace.createdAt.toISOString(),
                updatedAt: workspace.updatedAt.toISOString(),
            }

            return safeWorkspace;
        });

        return result;
    },

    async getById(workspaceId: string) {
        const workspace = await workspaceRepo.findById(workspaceId);
        if (!workspace) {
            throw new AppError("Workspace not found or access denied", 404);
        }

        return workspace;
    },

    async getByUserId(userId: string) {
        const workspaces = await workspaceRepo.findByUserId(userId);

        if (workspaces.length === 0) {
            throw new AppError("No workspaces found for the user", 404);
        }

        return workspaces;
    },

    async update(workspaceId: string, workspaceData: UpdateWorkspaceBody) {
        const workspace = await workspaceRepo.update(workspaceId, workspaceData);
        return workspace;
    },

    async delete(workspaceId: string) {
        await workspaceRepo.delete(workspaceId);
    },

    async inviteMember(workspaceId: string, inviteeId: string, role: WorkspaceRole, userId: string) {
        const result = await prisma.$transaction(async (tx) => {

            const existInvitee = await authRepo.findUserById(inviteeId, tx);
            if (!existInvitee) {
                throw new AppError("Invitee with the provided ID does not exist", 404);
            }

            const existingMembership = await workspaceRepo.findMembership(workspaceId, inviteeId, tx);
            if (existingMembership) {
                throw new AppError("User is already a member of the workspace", 400);
            }

            const existingInvite = await workspaceRepo.findInviteByEmail(workspaceId, existInvitee.email, tx);
            if (existingInvite) {
                throw new AppError("An invite has already been sent to this email for the workspace", 400);
            }

            const workspace = await workspaceRepo.findById(workspaceId, tx);
            if (!workspace) {
                throw new AppError("Workspace not found", 404);
            }

            const tokenJti = randomUUID();

            const token = signInviteToken({
                inviteeId: inviteeId,
                jti: tokenJti,
                email: existInvitee.email,
                workspaceId: workspace.id,
                role: role
            });

            const data: Prisma.InviteCreateInput = {
                email: existInvitee.email,
                role: role,
                tokenHash: await hash(token),
                jti: tokenJti,
                expiresAt: new Date(Date.now() + ms(env.TTL_INVITE_TOKEN as ms.StringValue)),
                workspace: { connect: { id: workspace.id } },
                creator: { connect: { id: userId } },
            }

            const invite = await workspaceRepo.inviteMembership(data, tx);

            return { invite, token, workspace };
        })

        const inviteLink = `${env.FRONTEND_URL}/invite?token=${encodeURIComponent(result.token)}`;
        await sendInviteEmail(result.invite.email, result.workspace.name, inviteLink);
        log.info(`Invite email sent to ${result.invite.email}`);

        return result.invite;
    },

    async acceptInvite(token: string, userId: string) {
        let payload: InviteTokenPayload

        try {
            payload = verifyInviteToken(token);

        } catch (error) {
            throw new AppError("Invalid invite token", 401)
        }

        if (payload.inviteeId !== userId) {
            throw new AppError("Invalid invite token", 403)
        }

        const result = await prisma.$transaction(async (tx) => {
            const invite = await workspaceRepo.findInviteByJti(payload.jti, tx);
            if (!invite) {
                throw new AppError("Invite not found or already used", 404);
            }

            const existMembership = await workspaceRepo.findMembership(payload.workspaceId, userId, tx);
            if (existMembership) {
                throw new AppError("You are already a member", 400);
            }

            const newMembershipDate: Prisma.WorkspaceMemberCreateInput = {
                role: invite.role,
                joinedAt: new Date(),
                workspace: { connect: { id: invite.workspaceId } },
                user: { connect: { id: userId } }
            }

            const newMembership = await workspaceRepo.createMembership(newMembershipDate, tx);

            const markInviteUsed = await workspaceRepo.markInviteUsed(payload.jti, tx);
            if (markInviteUsed.count === 0) {
                throw new AppError("Invite already used or expired", 400);
            }

            return newMembership;
        })

        return result;
    },

    async removeMember(workspaceId: string, memberId: string, actorId: string) {
        if (actorId !== memberId) {
            const actor = await workspaceRepo.findMembership(workspaceId, actorId);
            if (!actor) {
                throw new AppError("Workspace not found or access denied", 404);
            }

            if (!["admin", "owner"].includes(actor.role)) {
                throw new AppError("Forbidden", 403);
            }
        }

        const result = await workspaceRepo.deleteMembership(workspaceId, memberId);
        return result;
    },
}
