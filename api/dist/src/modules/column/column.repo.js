export class ColumnRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, db = this.prisma) {
        return await db.column.create({ data });
    }
    async listByProject(workspaceId, projectId, actorId, db = this.prisma) {
        return await db.column.findMany({
            where: {
                project: {
                    id: projectId,
                    workspace: {
                        id: workspaceId,
                        members: {
                            some: {
                                userId: actorId,
                            },
                        },
                    },
                },
            },
        });
    }
    async get(workspaceId, projectId, columnId, actorId, db = this.prisma) {
        return await db.column.findFirst({
            where: {
                id: columnId,
                project: {
                    id: projectId,
                    workspace: {
                        id: workspaceId,
                        members: {
                            some: {
                                userId: actorId,
                            },
                        },
                    },
                },
            },
        });
    }
    async update(data, workspaceId, projectId, columnId, actorId, db = this.prisma) {
        return await db.column.update({
            where: {
                id: columnId,
                project: {
                    id: projectId,
                    workspace: {
                        id: workspaceId,
                        members: {
                            some: {
                                userId: actorId,
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
    async remove(workspaceId, projectId, columnId, actorId, db = this.prisma) {
        return await db.column.delete({
            where: {
                id: columnId,
                project: {
                    id: projectId,
                    workspace: {
                        id: workspaceId,
                        members: {
                            some: {
                                userId: actorId,
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
