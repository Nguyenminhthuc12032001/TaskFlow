import type { ResourceContext } from "../../common/types/common.types.js";
import type { CreateBodyType, CreateFollowUpBodyType, UpdateBodyType, UpdateStageBodyType } from "./lead.schemas.js";

export class LeadService {
    constructor() {};

    create = async(data: CreateBodyType, ctx: ResourceContext) => {};

    get = async(ctx: ResourceContext) => {};

    listByWorkspace = async(ctx: ResourceContext) => {};

    update = async(data: UpdateBodyType, ctx: ResourceContext) => {}

    updateStage = async(data: UpdateStageBodyType, ctx: ResourceContext) => {};

    linkTask = async(ctx: ResourceContext) => {};

    unlinkTask = async(ctx: ResourceContext) => {};

    createFollowUpTask = async(data: CreateFollowUpBodyType, ctx: ResourceContext) => {};

    remove = async(data: CreateBodyType, ctx: ResourceContext) => {};
};