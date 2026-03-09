import type { Prisma } from "../../../prisma/generated/client.js";

export class ProjectRepo {
    constructor() {}

    create = async (data: Prisma.ProjectCreateInput, actorId: string) => {};

    get = async (id: string, actorId: string) => {};

    listByWorkspace = async (workspaceId: string, actorId: string) => {};

    listByUser = async (actorID: string) => {};

    update = async (data: Prisma.ProjectUpdateInput) => {};

    remove = async (id: string, actorId: string) => {}
}