import { listProjectsResponseSchema, safeProjectResponseSchema, } from './project.schemas.js';
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema, } from '../../common/utils/response/format.js';
import { validateResponse } from '../../common/utils/response/validate.js';
import { paginationQuerySchema } from '../../common/schemas/common.schemas.js';
export class ProjectController {
    constructor(projectService) {
        this.projectService = projectService;
        this.create = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                ActorId: req.user.id,
            };
            const project = await this.projectService.create(req.body, ctx);
            const safeProject = {
                workspaceId: project.workspaceId,
                id: project.id,
                name: project.name,
                description: project.description ?? '',
                createdAt: project.createdAt,
                createdBy: project.createdBy,
            };
            const envelop = created(safeProject);
            const envelopSchema = createdEnvelopeSchema(safeProjectResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
        };
        this.get = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                ActorId: req.user.id,
            };
            const project = await this.projectService.get(ctx);
            const safeProject = {
                workspaceId: project.workspaceId,
                id: project.id,
                name: project.name,
                description: project.description ?? '',
                createdAt: project.createdAt,
                createdBy: project.createdBy,
            };
            const envelop = ok(safeProject);
            const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.listByWorkspace = async (req, res) => {
            const paginationQuery = paginationQuerySchema.parse(req.query);
            const ctx = {
                workspaceId: req.params.workspaceId,
                ActorId: req.user.id,
            };
            const { projects, paginationMeta } = await this.projectService.listByWorkspace(ctx, paginationQuery);
            const safeProjectResponse = {
                data: projects.map((p) => ({
                    workspaceId: p.workspaceId,
                    id: p.id,
                    name: p.name,
                    description: p.description ?? '',
                    createdAt: p.createdAt,
                    createdBy: p.createdBy,
                })),
                paginationMeta
            };
            const envelop = ok(safeProjectResponse);
            const envelopSchema = okEnvelopeSchema(listProjectsResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.update = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                ActorId: req.user.id,
            };
            const project = await this.projectService.update(req.body, ctx);
            const safeProjectResponse = {
                workspaceId: project.workspaceId,
                id: project.id,
                name: project.name,
                description: project.description ?? '',
                createdAt: project.createdAt,
                createdBy: project.createdBy,
            };
            const envelop = ok(safeProjectResponse);
            const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.remove = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                ActorId: req.user.id,
            };
            const project = await this.projectService.remove(ctx);
            const safeProjectResponse = {
                workspaceId: project.workspaceId,
                id: project.id,
                name: project.name,
                description: project.description ?? '',
                createdAt: project.createdAt,
                createdBy: project.createdBy,
            };
            const envelop = ok(safeProjectResponse);
            const envelopSchema = okEnvelopeSchema(safeProjectResponseSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
    }
}
