export class CommentRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, db = this.prisma) {
        return await db.comment.create({ data });
    }
    async reply(data, db = this.prisma) {
        return await db.comment.create({ data });
    }
    async get(ctx, db = this.prisma) {
        return await db.comment.findUnique({
            where: {
                id: ctx.CommentId,
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    async listByTask(ctx, { skip, take }, db = this.prisma) {
        return await db.comment.findMany({
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
            skip,
            take
        });
    }
    async allCommentsByTask(ctx, db = this.prisma) {
        return await db.comment.findMany({
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    async countCommentsByTask(ctx, db = this.prisma) {
        return await db.comment.count({
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    async update(data, ctx, db = this.prisma) {
        return await db.comment.update({
            data,
            where: {
                id: ctx.CommentId,
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    async remove(ctx, db = this.prisma) {
        return await db.comment.delete({
            where: {
                id: ctx.CommentId,
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    async getMember(ctx, db = this.prisma) {
        return await db.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: ctx.workspaceId,
                    userId: ctx.ActorId,
                },
            },
        });
    }
}
