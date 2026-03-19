import { listProjectsResponseSchema, safeProjectResponseSchema } from "./project.schemas.js";
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from "../../common/utils/response/format.js";
import { validateResponse } from "../../common/utils/response/validate.js";
export class ProjectController {
    constructor(projectService) {
        this.projectService = projectService;
        this.create = async (req, res) => {
            const workspaceId = req.params.workspaceId;
            const project = await this.projectService.create(req.body, workspaceId, req.user.id);
            const safeProject = {
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
        };
        this.get = async (req, res) => {
            const project = await this.projectService.get(req.params.projectId, req.params.workspaceId, req.user.id);
            const safeProject = {
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
        };
        this.listByWorkspace = async (req, res) => {
            const projects = await this.projectService.listByWorkspace(req.params.workspaceId, req.user.id);
            const safeProjectResponse = projects.map((p) => ({
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
        this.update = async (req, res) => {
            const project = await this.projectService.update(req.body, req.params.workspaceId, req.params.projectId, req.user.id);
            const safeProjectResponse = {
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
        this.remove = async (req, res) => {
            const project = await this.projectService.remove(req.params.projectId, req.user.id);
            const safeProjectResponse = {
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
}
