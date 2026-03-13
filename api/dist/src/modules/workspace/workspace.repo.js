export class WorkspaceRepo {
    constructor(prisma) {
        this.prisma = prisma;
        this.create = async (workspaceData, db = this.prisma) => {
            return db.workspace.create({
                data: workspaceData,
            });
        };
        this.createMembership = async (workspaceMemberData, db = this.prisma) => {
            return db.workspaceMember.create({
                data: workspaceMemberData
            });
        };
        this.findMembership = async (workspaceId, userId, db = this.prisma) => {
            return db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId,
                        userId,
                    }
                }
            });
        };
        this.findMembers = async (workspaceId, db = this.prisma) => {
            return db.workspaceMember.findMany({
                where: {
                    workspaceId,
                },
                include: {
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });
        };
        this.findById = async (workspaceId, db = this.prisma) => {
            return db.workspace.findUnique({
                where: {
                    id: workspaceId,
                }
            });
        };
        this.findByUserId = async (userId, db = this.prisma) => {
            return db.workspace.findMany({
                where: {
                    members: {
                        some: { userId }
                    }
                }
            });
        };
        this.update = async (workspaceId, data, db = this.prisma) => {
            return db.workspace.update({
                where: {
                    id: workspaceId,
                },
                data,
            });
        };
        this.delete = async (workspaceId, db = this.prisma) => {
            return db.workspace.delete({
                where: { id: workspaceId }
            });
        };
        this.inviteMembership = async (inviteData, db = this.prisma) => {
            return db.invite.create({
                data: inviteData
            });
        };
        this.findInviteByEmail = async (workspaceId, email, db = this.prisma) => {
            return db.invite.findFirst({
                where: {
                    workspaceId,
                    email,
                    expiresAt: {
                        gt: new Date(),
                    },
                    usedAt: null,
                }
            });
        };
        this.findInviteByJti = async (jti, db = this.prisma) => {
            return db.invite.findFirst({
                where: {
                    jti,
                    expiresAt: {
                        gt: new Date(),
                    },
                    usedAt: null,
                },
            });
        };
        this.markInviteUsed = async (jti, db = this.prisma) => {
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
            });
        };
        this.deleteMembership = async (workspaceId, userId, db = this.prisma) => {
            return db.workspaceMember.delete({
                where: {
                    workspaceId_userId: {
                        workspaceId,
                        userId,
                    },
                }
            });
        };
    }
}
