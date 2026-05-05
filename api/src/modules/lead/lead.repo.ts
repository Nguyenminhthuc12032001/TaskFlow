import type { Prisma } from '../../../prisma/generated/client.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import type { DbClient, DbOrTxClient } from '../../db/prisma.js';

export class LeadRepo {
  constructor(readonly prisma: DbClient) { }

  async create(
    data: Prisma.LeadCreateInput,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.lead.create({ data });
  }

  async get(ctx: ResourceContext, db: DbOrTxClient = this.prisma) {
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
      include: {
        taskLinks: {
          include: {
            task: true,
          },
        }
      }
    });
  }

  async listByWorkspace(
    ctx: ResourceContext,
    search: string | undefined,
    { skip, take }: { skip: number; take: number },
    db: DbOrTxClient = this.prisma) {
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
        ...(search ? {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        } : {})
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async listByActorWorkspaces(
    actorId: string,
    search: string | undefined,
    { skip, take }: { skip: number; take: number },
    db: DbOrTxClient = this.prisma,
  ) {
    return await db.lead.findMany({
      where: {
        workspace: {
          members: {
            some: {
              userId: actorId,
              role: {
                in: ['member', 'admin', 'owner'],
              },
            },
          },
        },
        ...(search ? {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        } : {})
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async allLeadsByWorkspace(
    ctx: ResourceContext,
    { skip, take }: { skip: number; take: number },
    db: DbOrTxClient = this.prisma
  ) {
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
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async countLeadsByWorkspace(
    ctx: ResourceContext,
    search: string | undefined,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.lead.count({
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
        ...(search ? {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        } : {})
      },
    });
  }

  async countLeadsByActorWorkspaces(
    actorId: string,
    search: string | undefined,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.lead.count({
      where: {
        workspace: {
          members: {
            some: {
              userId: actorId,
              role: {
                in: ['member', 'admin', 'owner'],
              },
            },
          },
        },
        ...(search ? {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        } : {})
      },
    });
  }

  async update(
    data: Prisma.LeadUpdateInput,
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma,
  ) {
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

  async linkTask(
    data: Prisma.LeadTaskLinkCreateInput,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.leadTaskLink.create({ data });
  }

  async unlinkTask(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.leadTaskLink.delete({
      where: {
        leadId_taskId: {
          leadId: ctx.LeadId!,
          taskId: ctx.TaskId!,
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

  async remove(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
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

  async removeLeadTaskLink(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
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

  async existEmail(
    email: string,
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
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

  async existPhone(
    phone: string,
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
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

  async existLinkTask(
    ctx: ResourceContext,
    db: DbOrTxClient = this.prisma
  ) {
    return await db.leadTaskLink.findUnique({
      where: {
        leadId_taskId: { leadId: ctx.LeadId!, taskId: ctx.TaskId! },
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
