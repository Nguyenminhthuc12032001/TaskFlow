import type { ResourceContext } from "./task.type.js";

export class TaskService {
    constructor() { };

    create = async (data: any, ctx: ResourceContext) => { };

    assign = async (data: any, ctx: ResourceContext) => { };

    get = async (ctx: ResourceContext) => { };

    listByColumn = async (ctx: ResourceContext) => { };

    update = async (data: any, ctx: ResourceContext) => { };

    reOrder = async (data: any, ctx: ResourceContext) => { };

    archivTask = async (ctx: ResourceContext) => { };

    restoreTask = async (ctx: ResourceContext) => { };

    remove = async (ctx: ResourceContext) => { };

    bulkRemove = async (data: any, ctx: ResourceContext) => { };
};