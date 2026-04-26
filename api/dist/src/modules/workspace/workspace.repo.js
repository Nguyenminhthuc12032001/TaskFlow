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
            include: {
                user: {
                    select: { id: true, name: true, email: true },
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
    async findInviteCandidates(workspaceId, db = this.prisma) {
        const pendingInvites = await db.invite.findMany({
            where: {
                workspaceId,
                expiresAt: {
                    gt: new Date(),
                },
                usedAt: null,
            },
            select: {
                email: true,
            },
        });
        const pendingInviteEmails = pendingInvites.map((invite) => invite.email);
        return db.user.findMany({
            where: {
                memberships: {
                    none: {
                        workspaceId,
                    },
                },
                ...(pendingInviteEmails.length > 0
                    ? { email: { notIn: pendingInviteEmails } }
                    : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: [
                { name: 'asc' },
                { email: 'asc' },
            ],
        });
    }
    async findById(workspaceId, db = this.prisma) {
        return db.workspace.findUnique({
            where: {
                id: workspaceId,
            },
            include: {
                creator: {
                    select: {
                        name: true,
                    },
                },
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
            include: {
                creator: {
                    select: {
                        name: true,
                    },
                },
                members: {
                    where: { userId },
                    select: {
                        role: true,
                        joinedAt: true,
                    },
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
