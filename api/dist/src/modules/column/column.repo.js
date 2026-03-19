export class ColumnRepo {
    constructor(prisma) {
        this.prisma = prisma;
        this.create = async (data, db = this.prisma) => {
            return await db.column.create({ data });
        };
        this.listByProject = async (workspaceId, projectId, actorId, db = this.prisma) => {
            return await db.column.findMany({
                where: {
                    project: {
                        id: projectId,
                        workspace: {
                            id: workspaceId,
                            members: {
                                some: {
                                    userId: actorId
                                }
                            }
                        }
                    }
                }
            });
        };
        this.get = async (workspaceId, projectId, columnId, actorId, db = this.prisma) => {
            return await db.column.findFirst({
                where: {
                    id: columnId,
                    project: {
                        id: projectId,
                        workspace: {
                            id: workspaceId,
                            members: {
                                some: {
                                    userId: actorId
                                }
                            }
                        }
                    }
                },
            });
        };
        this.update = async (data, workspaceId, projectId, columnId, actorId, db = this.prisma) => {
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
                                        in: ["admin", "owner"]
                                    }
                                }
                            }
                        }
                    }
                },
                data
            });
        };
        this.remove = async (workspaceId, projectId, columnId, actorId, db = this.prisma) => {
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
                                        in: ["admin", "owner"]
                                    }
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
