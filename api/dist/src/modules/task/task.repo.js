export class TaskRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, db = this.prisma) {
        return await db.task.create({ data });
    }
    async isExistAssignee(userId, ctx, db = this.prisma) {
        return await db.taskAssignee.findFirst({
            where: {
                task: {
                    id: ctx.TaskId,
                    column: {
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
                },
                userId,
            },
        });
    }
    async assign(data, db = this.prisma) {
        return await db.taskAssignee.create({ data });
    }
    async get(ctx, db = this.prisma) {
        return await db.task.findUnique({
            where: {
                id: ctx.TaskId,
                column: {
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
            },
        });
    }
    async listByColumn(ctx, db = this.prisma) {
        return await db.task.findMany({
            where: {
                column: {
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
            },
        });
    }
    async update(data, ctx, db = this.prisma) {
        return await db.task.update({
            data,
            where: {
                id: ctx.TaskId,
                column: {
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
            },
        });
    }
    async archivTask(ctx, db = this.prisma) {
        return await db.task.update({
            where: {
                id: ctx.TaskId,
                column: {
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
            },
            data: {
                isArchiv: true,
            },
        });
    }
    async restoreTask(ctx, db = this.prisma) {
        return await db.task.update({
            where: {
                id: ctx.TaskId,
                column: {
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
            },
            data: {
                isArchiv: false,
            },
        });
    }
    async remove(ctx, db = this.prisma) {
        return await db.task.delete({
            where: {
                id: ctx.TaskId,
                column: {
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
            },
        });
    }
}
