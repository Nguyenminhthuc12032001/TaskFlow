export class TaskRepo {
    constructor(prisma) {
        this.prisma = prisma;
        this.create = async (data, db = this.prisma) => {
            return await db.task.create({ data });
        };
        this.isExistAssignee = async (userId, ctx, db = this.prisma) => {
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
                                                in: ["admin", "owner"]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    userId
                }
            });
        };
        this.assign = async (data, db = this.prisma) => {
            return await db.taskAssignee.create({ data });
        };
        this.get = async (ctx, db = this.prisma) => {
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
                                        userId: ctx.ActorId
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };
        this.listByColumn = async (ctx, db = this.prisma) => {
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
                                        userId: ctx.ActorId
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };
        this.update = async (data, ctx, db = this.prisma) => {
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
                                            in: ["admin", "owner"]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        };
        this.archivTask = async (ctx, db = this.prisma) => {
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
                                            in: ["admin", "owner"]
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                data: {
                    isArchiv: true
                }
            });
        };
        this.restoreTask = async (ctx, db = this.prisma) => {
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
                                            in: ["admin", "owner"]
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                data: {
                    isArchiv: false
                }
            });
        };
        this.remove = async (ctx, db = this.prisma) => {
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
                                            in: ["admin", "owner"]
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
