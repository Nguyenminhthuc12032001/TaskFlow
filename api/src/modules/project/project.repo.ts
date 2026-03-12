import type { Prisma } from "../../../prisma/generated/client.js";
import { type DbClient, type DbOrTxClient } from "../../db/prisma.js";

export class ProjectRepo {
    constructor(
        private readonly prisma: DbClient
    ) {};

    create = async (data: Prisma.ProjectCreateInput, db: DbOrTxClient = this.prisma) => {
        return await db.project.create({ data });
    };

    get = async (id: string, workspaceId: string, actorId: string, db: DbOrTxClient = this.prisma) => {
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
        })
    };

    listByWorkspace = async (workspaceId: string, actorId: string, db: DbOrTxClient = this.prisma) => {
        return await db.project.findMany(
            {
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
            }
        )
    };

    listByUser = async (actorId: string, db: DbOrTxClient = this.prisma) => {
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
        })
    };

    update = async (data: Prisma.ProjectUpdateInput, id: string, actorId: string, db: DbOrTxClient = this.prisma) => {
        return await db.project.update({
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
            },
            data,
        })
    };

    remove = async (id: string, actorId: string, db: DbOrTxClient = this.prisma) => {
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
        })
    };

    removeByWorkspace = async (workspaceId: string, actorId: string, db: DbOrTxClient = this.prisma) => {
        return await db.project.deleteMany({
            where: {
                workspaceId: workspaceId,
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
        })
    };
}