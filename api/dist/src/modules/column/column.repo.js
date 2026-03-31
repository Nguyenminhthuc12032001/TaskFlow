export class ColumnRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, db = this.prisma) {
        return await db.column.create({ data });
    }
    async listByProject(ctx, { skip, take }, db = this.prisma) {
        return await db.column.findMany({
            where: {
                project: {
                    id: ctx.projectId,
                    workspace: {
                        id: ctx.workspaceId,
                        members: {
                            some: {
                                userId: ctx.ActorId,
                            },
                        },
                    },
                },
            },
            skip,
            take,
        });
    }
    async allColumnsByProject(ctx, db = this.prisma) {
        return await db.column.findMany({
            where: {
                project: {
                    id: ctx.projectId,
                    workspace: {
                        id: ctx.workspaceId,
                        members: {
                            some: {
                                userId: ctx.ActorId,
                            },
                        },
                    },
                },
            },
        });
    }
    async countColumnsByProject(ctx, db = this.prisma) {
        return await db.column.count({
            where: {
                project: {
                    id: ctx.projectId,
                    workspace: {
                        id: ctx.workspaceId,
                        members: {
                            some: {
                                userId: ctx.ActorId,
                            },
                        },
                    },
                },
            },
        });
    }
    async get(ctx, db = this.prisma) {
        return await db.column.findFirst({
            where: {
                id: ctx.columnId,
                project: {
                    id: ctx.projectId,
                    workspace: {
                        id: ctx.workspaceId,
                        members: {
                            some: {
                                userId: ctx.ActorId,
                            },
                        },
                    },
                },
            },
        });
    }
    async update(data, ctx, db = this.prisma) {
        return await db.column.update({
            where: {
                id: ctx.columnId,
                project: {
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
            },
            data,
        });
    }
    async remove(ctx, db = this.prisma) {
        return await db.column.delete({
            where: {
                id: ctx.columnId,
                project: {
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
            },
        });
    }
}
