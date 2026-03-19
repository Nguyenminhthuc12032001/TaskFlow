import type { Request, Response } from "express";

export class TaskController {
    constructor () {};

    create = async (req: Request, res: Response) => {};

    get = async (req: Request, res: Response) => {};

    listByColumn = async (req: Request, res: Response) => {};

    update = async (req: Request, res: Response) => {};

    reOrder = async (req: Request, res: Response) => {};

    remove = async (req: Request, res: Response) => {};

    bulkRemove = async (re: Request, res: Response) => {};

    assign = async (req: Request, res: Response) => {};

    archivTask = async (req: Request, res: Response) => {};

    restoreTask = async (req: Request, res: Response) => {};
}