import type { Prisma } from "../../../prisma/generated/client.js";
import type { ResourceContext } from "./task.type.js";

export class TaskRepo {
    constructor() { };

    create = async (data: Prisma.TaskCreateInput, ctx: ResourceContext) => { };

    assign = async (data: Prisma.TaskAssigneeCreateInput, ctx: ResourceContext) => { };

    get = async (ctx: ResourceContext) => { };

    listByColumn = async (ctx: ResourceContext) => { };

    update = async (data: Prisma.TaskUpdateInput, ctx: ResourceContext) => { };

    reOrder = async (data: any, ctx: ResourceContext) => { };

    archivTask = async (ctx: ResourceContext) => { };

    restoreTask = async (ctx: ResourceContext) => { };

    remove = async (ctx: ResourceContext) => { };

    bulkRemove = async (data: any, ctx: ResourceContext) => { };
}