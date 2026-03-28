export class ProjectRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, db = this.prisma) {
        return await db.project.create({ data });
    }
    async get(id, workspaceId, actorId, db = this.prisma) {
        return await db.project.findFirst({
            where: {
                id,
                workspaceId,
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
    async listByWorkspace(workspaceId, actorId, db = this.prisma) {
        return await db.project.findMany({
            where: {
                workspaceId,
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
    async update(data, workspaceId, projectId, actorId, db = this.prisma) {
        return await db.project.update({
            where: {
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
            data,
        });
    }
    async remove(id, actorId, db = this.prisma) {
        return await db.project.delete({
            where: {
                id,
                workspace: {
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
        });
    }
}
