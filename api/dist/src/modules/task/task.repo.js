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
            include: {
                assignees: {
                    include: {
                        user: true,
                    },
                },
            },
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
    async listByColumn(ctx, search, dateRange, dueDateRange, priority, { take, skip }, db = this.prisma) {
        return await db.task.findMany({
            include: {
                assignees: true,
            },
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
                ...(search ? {
                    title: {
                        contains: search,
                        mode: 'insensitive',
                    }
                } : {}),
                ...(dateRange?.startDate || dateRange?.endDate ? {
                    createdAt: {
                        ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
                        ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
                    }
                } : {}),
                ...(dueDateRange?.startDate || dueDateRange?.endDate ? {
                    dueDate: {
                        ...(dueDateRange.startDate ? { gte: dueDateRange.startDate } : {}),
                        ...(dueDateRange.endDate ? { lte: dueDateRange.endDate } : {}),
                    }
                } : {}),
                ...(priority ? { priority } : {})
            },
            orderBy: {
                position: 'asc'
            },
            skip,
            take,
        });
    }
    async allTasksByColumn(ctx, db = this.prisma) {
        return await db.task.findMany({
            include: {
                assignees: true,
            },
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
            orderBy: {
                position: 'asc'
            }
        });
    }
    async countTasksByColumn(ctx, search, dateRange, dueDateRange, priority, db = this.prisma) {
        return await db.task.count({
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
                ...(search ? {
                    title: {
                        contains: search,
                        mode: 'insensitive',
                    }
                } : {}),
                ...(dateRange?.startDate || dateRange?.endDate ? {
                    createdAt: {
                        ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
                        ...(dateRange.endDate ? { lte: dateRange.endDate } : {}),
                    }
                } : {}),
                ...(dueDateRange?.startDate || dueDateRange?.endDate ? {
                    dueDate: {
                        ...(dueDateRange.startDate ? { gte: dueDateRange.startDate } : {}),
                        ...(dueDateRange.endDate ? { lte: dueDateRange.endDate } : {}),
                    }
                } : {}),
                ...(priority ? { priority } : {})
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
