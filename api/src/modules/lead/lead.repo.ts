import type { Prisma } from "../../../prisma/generated/client.js";
import type { ResourceContext } from "../../common/types/common.types.js";
import type { DbClient, DbOrTxClient } from "../../db/prisma.js";

export class LeadRepo {
    constructor(
        readonly prisma: DbClient
    ) { };

    create = async (data: Prisma.LeadCreateInput, db: DbOrTxClient = this.prisma) => {
        return await db.lead.create({ data });
    };

    get = async (ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
        return await db.lead.findUnique({
            where: {
                id: ctx.LeadId,
                workspace: {
                    id: ctx.workspaceId,
                    members: {
                        some: {
                            userId: ctx.ActorId,
                            role: {
                                in: ["member"]
                            }
                        }
                    }
                }
            }
        });
    };

    listByWorkspace = async (ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
        return await db.lead.findMany({
            where: {
                workspace: {
                    id: ctx.workspaceId,
                    members: {
                        some: {
                            userId: ctx.ActorId,
                            role: {
                                in: ["member"]
                            }
                        }
                    }
                }
            }
        });
    };

    update = async (data: Prisma.LeadUpdateInput, ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
        return await db.lead.update({
            data,
            where: {
                id: ctx.LeadId,
                OR:
                    [
                        {
                            createdBy: ctx.ActorId,
                            workspace: {
                                id: ctx.workspaceId,
                                members: {
                                    some: {
                                        userId: ctx.ActorId,
                                    }
                                }
                            }
                        },
                        {
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
                    ]
            }
        });
    };

    linkTask = async (data: Prisma.LeadTaskLinkCreateInput, ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
        return await db.leadTaskLink.create({ data });
    };

    unlinkTask = async (ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
        return await db.leadTaskLink.delete({
            where: {
                leadId_taskId: {
                    leadId: ctx.LeadId!, taskId: ctx.TaskId!
                },
                OR:
                    [
                        {
                            lead: {
                                createdBy: ctx.ActorId,
                                workspace: {
                                    id: ctx.workspaceId,
                                    members: {
                                        some: {
                                            userId: ctx.ActorId
                                        }
                                    }
                                }
                            }
                        },
                        {
                            lead: {
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
                    ]
            }
        });
    };

    remove = async (ctx: ResourceContext, db: DbOrTxClient = this.prisma) => {
        return await db.lead.delete({
            where: {
                id: ctx.LeadId,
                OR:
                    [
                        {
                            createdBy: ctx.ActorId,
                            workspace: {
                                id: ctx.workspaceId,
                                members: {
                                    some: {
                                        userId: ctx.ActorId,
                                    }
                                }
                            }
                        },
                        {
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
                    ],
            }
        })
    };
}