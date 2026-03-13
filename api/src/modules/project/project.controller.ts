import type { Request, Response } from "express"
import type { ProjectService } from "./project.service.js"
import { listProjectsResponseSchema, safeProjectResponseSchema, type CreateBodyType, type ListProjectResponseType, type SafeProjectResponseType, type UpdateBodyType } from "./project.schemas.js"
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from "../../common/utils/response/format.js";
import { validateResponse } from "../../common/utils/response/validate.js";
import type { WorkspaceParams } from "../../common/middlewares/requireWorkspaceRole.middleware.js";

export class ProjectController {
    constructor (
        private readonly projectService: ProjectService
    ) {}

    create = async (req: Request<WorkspaceParams, {}, CreateBodyType, {}, {}>, res: Response) => {

        const workspaceId = req.params.workspaceId;

        const project = await this.projectService.create(req.body, workspaceId, req.user!.id);

        const safeProject: SafeProjectResponseType = {
            workspaceId: project.workspaceId,
            id: project.id,
            name: project.name,
            description: project.description ?? "",
            createdAt: project.createdAt,
            createdBy: project.createdBy
        };

        const envelop = created(safeProject);
        const envelopSchema = createdEnvelopeSchema(safeProjectResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(201).json(validatedEnvelop);
    }

    get = async (req: Request<WorkspaceParams, {}, {}, {}, {}>, res: Response) => {

        const project = await this.projectService.get(req.params.projectId!, req.params.workspaceId, req.user!.id);

        const safeProject: SafeProjectResponseType = {
            workspaceId: project.workspaceId,
            id: project.id,
            name: project.name,
            description: project.description ?? "",
            createdAt: project.createdAt,
            createdBy: project.createdBy
        };

        const envelop = ok(safeProject);
        const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    }

    listByWorkspace = async (req: Request<WorkspaceParams, {}, {}, {}, {}>, res: Response) => {
        const projects = await this.projectService.listByWorkspace(req.params.workspaceId, req.user!.id);

        const safeProjectResponse: ListProjectResponseType = projects.map((p) => ({
            workspaceId: p.workspaceId,
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            createdAt: p.createdAt,
            createdBy: p.createdBy
        }));

        const envelop = ok(safeProjectResponse);
        const envelopSchema = okEnvelopeSchema(listProjectsResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    update = async (req: Request<WorkspaceParams, {}, UpdateBodyType, {}, {}>, res: Response) => {
        const project = await this.projectService.update(req.body, req.params.projectId!, req.user!.id);

        const safeProjectResponse: SafeProjectResponseType = {
            workspaceId: project.workspaceId,
            id: project.id,
            name: project.name,
            description: project.description ?? "",
            createdAt: project.createdAt,
            createdBy: project.createdBy
        };

        const envelop = ok(safeProjectResponse);
        const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };

    remove = async (req: Request<WorkspaceParams, {}, {}, {}, {}>, res: Response) => {
        const project = await this.projectService.remove(req.params.projectId!, req.user!.id);

        const safeProjectResponse: SafeProjectResponseType = {
            workspaceId: project.workspaceId,
            id: project.id,
            name: project.name,
            description: project.description ?? "",
            createdAt: project.createdAt,
            createdBy: project.createdBy
        };

        const envelop = ok(safeProjectResponse);
        const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
        const validatedEnvelop = validateResponse(envelopSchema)(envelop);

        return res.status(200).json(validatedEnvelop);
    };
}
