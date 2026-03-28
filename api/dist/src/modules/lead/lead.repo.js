export class LeadRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data, db = this.prisma) {
        return await db.lead.create({ data });
    }
    async get(ctx, db = this.prisma) {
        return await db.lead.findUnique({
            where: {
                id: ctx.LeadId,
                workspace: {
                    id: ctx.workspaceId,
                    members: {
                        some: {
                            userId: ctx.ActorId,
                            role: {
                                in: ['member', 'admin', 'owner'],
                            },
                        },
                    },
                },
            },
        });
    }
    async listByWorkspace(ctx, db = this.prisma) {
        return await db.lead.findMany({
            where: {
                workspace: {
                    id: ctx.workspaceId,
                    members: {
                        some: {
                            userId: ctx.ActorId,
                            role: {
                                in: ['member', 'admin', 'owner'],
                            },
                        },
                    },
                },
            },
        });
    }
    async update(data, ctx, db = this.prisma) {
        return await db.lead.update({
            data,
            where: {
                id: ctx.LeadId,
                OR: [
                    {
                        createdBy: ctx.ActorId,
                        workspace: {
                            id: ctx.workspaceId,
                            members: {
                                some: {
                                    userId: ctx.ActorId,
                                },
                            },
                        },
                    },
                    {
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
                ],
            },
        });
    }
    async linkTask(data, db = this.prisma) {
        return await db.leadTaskLink.create({ data });
    }
    async unlinkTask(ctx, db = this.prisma) {
        return await db.leadTaskLink.delete({
            where: {
                leadId_taskId: {
                    leadId: ctx.LeadId,
                    taskId: ctx.TaskId,
                },
                OR: [
                    {
                        lead: {
                            createdBy: ctx.ActorId,
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
                    {
                        lead: {
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
                ],
            },
        });
    }
    async remove(ctx, db = this.prisma) {
        return await db.lead.delete({
            where: {
                id: ctx.LeadId,
                OR: [
                    {
                        createdBy: ctx.ActorId,
                        workspace: {
                            id: ctx.workspaceId,
                            members: {
                                some: {
                                    userId: ctx.ActorId,
                                },
                            },
                        },
                    },
                    {
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
                ],
            },
        });
    }
    async removeLeadTaskLink(ctx, db = this.prisma) {
        return await db.leadTaskLink.deleteMany({
            where: {
                leadId: ctx.LeadId,
                OR: [
                    {
                        lead: {
                            createdBy: ctx.ActorId,
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
                    {
                        lead: {
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
                ],
            },
        });
    }
    async existEmail(email, ctx, db = this.prisma) {
        return await db.lead.findFirst({
            where: {
                email,
                OR: [
                    {
                        createdBy: ctx.ActorId,
                        workspace: {
                            id: ctx.workspaceId,
                            members: {
                                some: {
                                    userId: ctx.ActorId,
                                },
                            },
                        },
                    },
                    {
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
                ],
            },
        });
    }
    async existPhone(phone, ctx, db = this.prisma) {
        return await db.lead.findFirst({
            where: {
                phone,
                OR: [
                    {
                        createdBy: ctx.ActorId,
                        workspace: {
                            id: ctx.workspaceId,
                            members: {
                                some: {
                                    userId: ctx.ActorId,
                                },
                            },
                        },
                    },
                    {
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
                ],
            },
        });
    }
    async existLinkTask(ctx, db = this.prisma) {
        return await db.leadTaskLink.findUnique({
            where: {
                leadId_taskId: { leadId: ctx.LeadId, taskId: ctx.TaskId },
                lead: {
                    OR: [
                        {
                            createdBy: ctx.ActorId,
                            workspace: {
                                id: ctx.workspaceId,
                                members: {
                                    some: {
                                        userId: ctx.ActorId,
                                    },
                                },
                            },
                        },
                        {
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
                    ],
                },
            },
        });
    }
}
