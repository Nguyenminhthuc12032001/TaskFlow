export class ColumnRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, db = this.prisma) {
        return await db.column.create({ data });
    }
    async listByProject(ctx, search, dateRange, type, { skip, take }, db = this.prisma) {
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
                ...(search ? {
                    name: {
                        contains: search,
                        mode: 'insensitive',
                    }
                } : {}),
                ...(type ? { type } : {}),
                ...(dateRange?.startDate || dateRange?.endDate ? {
                    createdAt: {
                        ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
                        ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
                    }
                } : {})
            },
            skip,
            take,
            orderBy: {
                position: 'asc'
            }
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
            orderBy: {
                position: 'asc'
            }
        });
    }
    async countColumnsByProject(ctx, search, dateRange, type, db = this.prisma) {
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
                ...(search ? {
                    name: {
                        contains: search,
                        mode: 'insensitive',
                    }
                } : {}),
                ...(type ? { type } : {}),
                ...(dateRange?.startDate || dateRange?.endDate ? {
                    createdAt: {
                        ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
                        ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
                    }
                } : {})
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
