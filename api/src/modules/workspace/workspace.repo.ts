import { Prisma } from "../../../prisma/generated/client.js";
import { prisma, type DbOrTxClient } from "../../db/prisma.js";

export class WorkspaceRepo {
    create = async (
        workspaceData: Prisma.WorkspaceCreateInput,
        db: DbOrTxClient = prisma
    ) => {
        return db.workspace.create({
            data: workspaceData,
        });
    };

    createMembership = async (
        workspaceMemberData: Prisma.WorkspaceMemberCreateInput,
        db: DbOrTxClient = prisma
    ) => {
        return db.workspaceMember.create({
            data: workspaceMemberData
        })
    };

    findMembership = async (
        workspaceId: string,
        userId: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                }
            }
        })
    };

    findMembers = async (
        workspaceId: string,
        db: DbOrTxClient = prisma
    ) => {
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
    };

    findById = async (
        workspaceId: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.workspace.findUnique({
            where: {
                id: workspaceId,
            }
        })
    };

    findByUserId = async (
        userId: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.workspace.findMany({
            where: {
                members: {
                    some: { userId }
                }
            }
        })
    };

    update = async (
        workspaceId: string,
        data: Prisma.WorkspaceUpdateInput,
        db: DbOrTxClient = prisma
    ) => {
        return db.workspace.update({
            where: {
                id: workspaceId,
            },
            data,
        })
    };

    delete = async (
        workspaceId: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.workspace.delete({
            where: { id: workspaceId }
        })
    };

    inviteMembership = async (
        inviteData: Prisma.InviteCreateInput,
        db: DbOrTxClient = prisma
    ) => {
        return db.invite.create({
            data: inviteData
        })
    };
    
    findInviteByEmail = async (
        workspaceId: string,
        email: string,
        db: DbOrTxClient = prisma
    ) => {
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
    };

    findInviteByJti = async (
        jti: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.invite.findFirst({
            where: {
                jti,
                expiresAt:{
                    gt: new Date(),
                },
                usedAt: null,
            },
        })
    };

    markInviteUsed = async (
        jti: string,
        db: DbOrTxClient = prisma
    ) => {
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
    };

    deleteMembership = async (
        workspaceId: string,
        userId: string,
        db: DbOrTxClient = prisma
    ) => {
        return db.workspaceMember.delete({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                },

            }
        })
    };
}
