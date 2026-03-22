import type { Prisma } from "../../../prisma/generated/client.js";
import type { ResourceContext } from "../../common/types/common.types.js";
import type { DbClient, DbOrTxClient } from "../../db/prisma.js";

export class CommentRepo {
    constructor(
        readonly prisma: DbClient
    ) { };

    create = async (data: Prisma.CommentCreateInput, db: DbOrTxClient = this.prisma) => {
        return await db.comment.create({ data });
    };

    reply = async (data: Prisma.CommentCreateInput, db: DbOrTxClient = this.prisma) => {
        return await db.comment.create({ data });
    };

    get = async (ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
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
        })
    };

    listByTask = async (ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
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
        })
    };

    update = async (data: Prisma.CommentUpdateInput, ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
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
        })
    };

    remove = async (ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
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
        })
    };
}