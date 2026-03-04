import { Prisma } from "../../../prisma/generated/client.js";
import { prisma, type DbOrTxClient } from "../../db/prisma.js";

export class WorkspaceRepo {
    async create(
        workspaceData: Prisma.WorkspaceCreateInput,
        db: DbOrTxClient = prisma
    ) {
        return db.workspace.create({
            data: workspaceData,
        });
    }

    async createMembership(
        workspaceMemberData: Prisma.WorkspaceMemberCreateInput,
        db: DbOrTxClient = prisma
    ) {
        return db.workspaceMember.create({
            data: workspaceMemberData
        })
    }

    async findMembership(
        workspaceId: string,
        userId: string,
        db: DbOrTxClient = prisma
    ) {
        return db.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                }
            }
        })
    }

    async findMembers(
        workspaceId: string,
        db: DbOrTxClient = prisma
    ) {
        return db.workspaceMember.findMany({
            where: {
                workspaceId,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        })
    }

    async findById(
        workspaceId: string,
        db: DbOrTxClient = prisma
    ) {
        return db.workspace.findUnique({
            where: {
                id: workspaceId,
            }
        })
    }

    async findByUserId(
        userId: string,
        db: DbOrTxClient = prisma
    ) {
        return db.workspace.findMany({
            where: {
                members: {
                    some: { userId }
                }
            }
        })
    }

    async update(
        workspaceId: string,
        data: Prisma.WorkspaceUpdateInput,
        db: DbOrTxClient = prisma
    ) {
        return db.workspace.update({
            where: {
                id: workspaceId,
            },
            data,
        })
    }

    async delete(
        workspaceId: string,
        db: DbOrTxClient = prisma
    ) {
        return db.workspace.delete({
            where: { id: workspaceId }
        })
    }

    async inviteMembership(
        inviteData: Prisma.InviteCreateInput,
        db: DbOrTxClient = prisma
    ) {
        return db.invite.create({
            data: inviteData
        })
    }
    
    async findInviteByEmail(
        workspaceId: string,
        email: string,
        db: DbOrTxClient = prisma
    ) {
        return db.invite.findFirst({
            where: {
                workspaceId,
                email,
                expiresAt: {
                    gt: new Date(),
                },
                usedAt: null,
            }
        })
    }

    async findInviteByJti(
        jti: string,
        db: DbOrTxClient = prisma
    ) {
        return db.invite.findFirst({
            where: {
                jti,
                expiresAt:{
                    gt: new Date(),
                },
                usedAt: null,
            },
        })
    }

    async markInviteUsed(
        jti: string,
        db: DbOrTxClient = prisma
    ) {
        return db.invite.updateMany({
            where: {
                jti,
                expiresAt: {
                    gt: new Date()
                },
                usedAt: null
            },
            data: {
                usedAt: new Date(),
            }
        })
    }

    async deleteMembership(
        workspaceId: string,
        userId: string,
        db: DbOrTxClient = prisma
    ) {
        return db.workspaceMember.delete({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                },

            }
        })
    }
}
