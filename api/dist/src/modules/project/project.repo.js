export class ProjectRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, db = this.prisma) {
        return await db.project.create({ data });
    }
    async get(ctx, db = this.prisma) {
        return await db.project.findFirst({
            where: {
                id: ctx.projectId,
                workspaceId: ctx.workspaceId,
                workspace: {
                    members: {
                        some: {
                            userId: ctx.ActorId,
                        },
                    },
                },
            },
        });
    }
    async listByWorkspace(ctx, { take, skip }, db = this.prisma) {
        return await db.project.findMany({
            where: {
                workspaceId: ctx.workspaceId,
                workspace: {
                    members: {
                        some: {
                            userId: ctx.ActorId,
                        },
                    },
                },
            },
            skip,
            take,
        });
    }
    async allProjectsByWorkspace(ctx, db = this.prisma) {
        return await db.project.findMany({
            where: {
                workspaceId: ctx.workspaceId,
                workspace: {
                    members: {
                        some: {
                            userId: ctx.ActorId,
                        },
                    },
                },
            },
        });
    }
    async listByUser(actorId, db = this.prisma) {
        return await db.project.findMany({
            where: {
                workspace: {
                    members: {
                        some: {
                            userId: actorId,
                        },
                    },
                },
            },
        });
    }
    async update(data, ctx, db = this.prisma) {
        return await db.project.update({
            where: {
                id: ctx.projectId,
                workspace: {
                    id: ctx.workspaceId,
                    members: {
                        some: {
                            userId: ctx.ActorId,
                            role: {
                                in: ['admin', 'owner'],
                            },
                        },
                    },
                },
            },
            data,
        });
    }
    async remove(ctx, db = this.prisma) {
        return await db.project.delete({
            where: {
                id: ctx.projectId,
                workspace: {
                    id: ctx.workspaceId,
                    members: {
                        some: {
                            userId: ctx.ActorId,
                            role: {
                                in: ['admin', 'owner'],
                            },
                        },
                    },
                },
            },
        });
    }
    async countProjectsByWorkspace(ctx, db = this.prisma) {
        return await db.project.count({
            where: {
                workspaceId: ctx.workspaceId,
                workspace: {
                    members: {
                        some: {
                            userId: ctx.ActorId,
                        },
                    },
                },
            },
        });
    }
}
