import type { Request, Response } from "express";
import type { WorkspaceParams } from "../../common/middlewares/requireWorkspaceRole.middleware.js";

export class LeadController {
    constructor() { };

    create = async(req: Request<WorkspaceParams>, res: Response) => {};

    get = async(req: Request<WorkspaceParams>, res: Response) => {};

    listByWorkspace = async(req: Request<WorkspaceParams>, res: Response) => {};

    update = async(req: Request<WorkspaceParams>, res: Response) => {};

    updateStage = async(req: Request<WorkspaceParams>, res: Response) => {};

    linkTask = async(req: Request<WorkspaceParams>, res: Response) => {};

    unlinkTask = async(req: Request<WorkspaceParams>, res: Response) => {};

    createFollowUpTask = async(req: Request<WorkspaceParams>, res: Response) => {};

    remove = async(req: Request<WorkspaceParams>, res: Response) => {};
};