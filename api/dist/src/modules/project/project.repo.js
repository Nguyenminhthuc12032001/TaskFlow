export class ProjectRepo {
    constructor(prisma) {
        this.prisma = prisma;
        this.create = async (data, db = this.prisma) => {
            return await db.project.create({ data });
        };
        this.get = async (id, workspaceId, actorId, db = this.prisma) => {
            return await db.project.findFirst({
                where: {
                    id,
                    workspaceId,
                    workspace: {
                        members: {
                            some: {
                                userId: actorId
                            }
                        }
                    }
                }
            });
        };
        this.listByWorkspace = async (workspaceId, actorId, db = this.prisma) => {
            return await db.project.findMany({
                where: {
                    workspaceId,
                    workspace: {
                        members: {
                            some: {
                                userId: actorId
                            }
                        }
                    }
                }
            });
        };
        this.listByUser = async (actorId, db = this.prisma) => {
            return await db.project.findMany({
                where: {
                    workspace: {
                        members: {
                            some: {
                                userId: actorId
                            }
                        }
                    }
                }
            });
        };
        this.update = async (data, workspaceId, projectId, actorId, db = this.prisma) => {
            return await db.project.update({
                where: {
                    id: projectId,
                    workspace: {
                        id: workspaceId,
                        members: {
                            some: {
                                userId: actorId,
                                role: {
                                    in: ["admin", "owner"]
                                }
                            }
                        }
                    }
                },
                data,
            });
        };
        this.remove = async (id, actorId, db = this.prisma) => {
            return await db.project.delete({
                where: {
                    id,
                    workspace: {
                        members: {
                            some: {
                                userId: actorId,
                                role: {
                                    in: ["admin", "owner"]
                                }
                            }
                        }
                    }
                }
            });
        };
    }
    ;
}
