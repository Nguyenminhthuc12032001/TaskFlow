import { Request, Response } from 'express';
import type { WorkspaceService } from './workspace.service.js';

export class WorkspaceController {
    constructor(
        workspaceService: WorkspaceService
    ) {}

    create = async (req: Request, res: Response) => {
        // TODO
    }

    list = async (req: Request, res: Response) => {
        // TODO
    }

    getById = async (req: Request, res: Response) => {
        // TODO
    }

    update = async (req: Request, res: Response) => {
        // TODO
    }

    remove = async (req: Request, res: Response) => {
        // TODO
    }

    invinte = async (req: Request, res: Response) => {
        // TODO
    }
}