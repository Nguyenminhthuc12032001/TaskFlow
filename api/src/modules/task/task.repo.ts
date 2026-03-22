import type { Prisma } from "../../../prisma/generated/client.js";
import type { ResourceContext } from "../../common/types/common.types.js";
import type { DbClient, DbOrTxClient } from "../../db/prisma.js";

export class TaskRepo {
    constructor(
        readonly prisma: DbClient
    ) { };

    create = async (
        data: Prisma.TaskCreateInput,
        db: DbOrTxClient = this.prisma
    ) => {
        return await db.task.create({ data });
    };

    isExistAssignee = async (
        userId: string,
        ctx: ResourceContext,
        db: DbOrTxClient = this.prisma
    ) => {
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
        })
    };

    assign = async (
        data: Prisma.TaskAssigneeCreateInput,
        db: DbOrTxClient = this.prisma
    ) => {
        return await db.taskAssignee.create({ data });
    };

    get = async (
        ctx: ResourceContext,
        db: DbOrTxClient = this.prisma
    ) => {
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
        })
    };

    listByColumn = async (
        ctx: ResourceContext,
        db: DbOrTxClient = this.prisma
    ) => {
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
        })
    };

    update = async (
        data: Prisma.TaskUpdateInput,
        ctx: ResourceContext,
        db: DbOrTxClient = this.prisma
    ) => {
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
        })
    };

    archivTask = async (
        ctx: ResourceContext,
        db: DbOrTxClient = this.prisma
    ) => {
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
        })
    };

    restoreTask = async (
        ctx: ResourceContext,
        db: DbOrTxClient = this.prisma
    ) => {
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
        })
    };

    remove = async (
        ctx: ResourceContext,
        db: DbOrTxClient = this.prisma
    ) => {
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
        })
    };
}