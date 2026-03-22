export class CommentRepo {
    constructor(prisma) {
        this.prisma = prisma;
        this.create = async (data, db = this.prisma) => {
            return await db.comment.create({ data });
        };
        this.reply = async (data, db = this.prisma) => {
            return await db.comment.create({ data });
        };
        this.get = async (ctx, db = this.prisma) => {
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
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };
        this.listByTask = async (ctx, db = this.prisma) => {
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
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };
        this.update = async (data, ctx, db = this.prisma) => {
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
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };
        this.remove = async (ctx, db = this.prisma) => {
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
                                        }
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
