import { Request, Response } from 'express';
import type { WorkspaceService } from './workspace.service.js';
import { createResponseSchema, getByIdResponseSchema, type CreateWorkspaceBody, type SafeWorkspaceResponse, type SafeWorkspacesResponse } from './workspace.schemas.js';
import { validateResponse } from '../../common/utils/response/validate.js';
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from '../../common/utils/response/format.js';
import type { WorkspaceParams } from '../../common/middlewares/requireWorkspaceMember.middleware.js';

export class WorkspaceController {
    constructor(
        private workspaceService: WorkspaceService
    ) {}

    create = async (req: Request<{}, {}, CreateWorkspaceBody>, res: Response) => {
        const workspace = await this.workspaceService.create(req.body, req.user!.id);

        const workspaceResponse: SafeWorkspaceResponse = {
            id: workspace.id,
            name: workspace.name,
            createdBy: workspace.createdBy,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt
        }

        const envelop = created(workspaceResponse);
        const envelopSchema = createdEnvelopeSchema(createResponseSchema);
        const validateEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(201).json(validateEnvelop);
    }

    getById = async (req: Request<WorkspaceParams>, res: Response) => {
        const workspace = await this.workspaceService.getById(req.params.workspaceId, req.user!.id);

        const workspacesResponse: SafeWorkspaceResponse = {
            id: workspace.id,
            name: workspace.name,
            createdBy: workspace.createdBy,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt
        }

        const envelop = ok(workspacesResponse);
        const envelopSchema = okEnvelopeSchema(getByIdResponseSchema);
        const validateEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validateEnvelop);
    }

    getByUserId = async (req: Request, res: Response) => {
        // TODO
    }

    getMemberById = async (req: Request, res: Response) => {
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

    accept = async (req: Request, res: Response) => {
        // TODO
    }

    removeMember = async (req: Request, res: Response) => {
        // TODO
    }
}