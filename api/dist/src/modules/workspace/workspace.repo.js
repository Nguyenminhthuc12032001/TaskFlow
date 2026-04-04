export class WorkspaceRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(workspaceData, db = this.prisma) {
        return db.workspace.create({
            data: workspaceData,
        });
    }
    async createMembership(workspaceMemberData, db = this.prisma) {
        return db.workspaceMember.create({
            data: workspaceMemberData,
        });
    }
    async findMembership(workspaceId, userId, db = this.prisma) {
        return db.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                },
            },
        });
    }
    async findMembers(workspaceId, { take, skip }, db = this.prisma) {
        return db.workspaceMember.findMany({
            where: {
                workspaceId,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            skip,
            take,
            orderBy: {
                joinedAt: 'desc',
            }
        });
    }
    async findById(workspaceId, db = this.prisma) {
        return db.workspace.findUnique({
            where: {
                id: workspaceId,
            },
        });
    }
    async findByUserId(userId, { take, skip }, db = this.prisma) {
        return db.workspace.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
            skip,
            take,
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async findAllByUserId(userId, db = this.prisma) {
        return db.workspace.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async update(workspaceId, data, db = this.prisma) {
        return db.workspace.update({
            where: {
                id: workspaceId,
            },
            data,
        });
    }
    async delete(workspaceId, db = this.prisma) {
        return db.workspace.delete({
            where: { id: workspaceId },
        });
    }
    async inviteMembership(inviteData, db = this.prisma) {
        return db.invite.create({
            data: inviteData,
        });
    }
    async findInviteByEmail(workspaceId, email, db = this.prisma) {
        return db.invite.findFirst({
            where: {
                workspaceId,
                email,
                expiresAt: {
                    gt: new Date(),
                },
                usedAt: null,
            },
        });
    }
    async findInviteByJti(jti, db = this.prisma) {
        return db.invite.findFirst({
            where: {
                jti,
                expiresAt: {
                    gt: new Date(),
                },
                usedAt: null,
            },
        });
    }
    async markInviteUsed(jti, db = this.prisma) {
        return db.invite.updateMany({
            where: {
                jti,
                expiresAt: {
                    gt: new Date(),
                },
                usedAt: null,
            },
            data: {
                usedAt: new Date(),
            },
        });
    }
    async deleteMembership(workspaceId, userId, db = this.prisma) {
        return db.workspaceMember.delete({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                },
            },
        });
    }
    async countWorkspaceMembers(workspaceId, db = this.prisma) {
        return db.workspaceMember.count({
            where: {
                workspaceId,
            },
        });
    }
    async countWorkspacesByUserId(userId, db = this.prisma) {
        return db.workspace.count({
            where: {
                members: {
                    some: { userId },
                },
            },
        });
    }
}
