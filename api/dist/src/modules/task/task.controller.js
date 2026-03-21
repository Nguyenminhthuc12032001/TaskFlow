import { safeAssigneeSchema, safeTaskSchema, safeTasksSchema } from "./task.schemas.js";
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from "../../common/utils/response/format.js";
import { validateResponse } from "../../common/utils/response/validate.js";
export class TaskController {
    constructor(taskService) {
        this.taskService = taskService;
        this.create = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id
            };
            const task = await this.taskService.create(req.body, ctx);
            const safeTask = {
                id: task.id,
                projectId: task.projectId,
                columnId: task.columnId,
                title: task.title,
                priority: task.priority,
                position: task.position,
                createdBy: task.createdBy,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                description: task.description ?? "",
                dueDate: task.dueDate ?? undefined
            };
            const envelop = created(safeTask);
            const envelopSchema = createdEnvelopeSchema(safeTaskSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
        };
        this.get = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id
            };
            const task = await this.taskService.get(ctx);
            const safeTask = {
                id: task.id,
                projectId: task.projectId,
                columnId: task.columnId,
                title: task.title,
                priority: task.priority,
                position: task.position,
                createdBy: task.createdBy,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                description: task.description ?? "",
                dueDate: task.dueDate ?? undefined
            };
            const envelop = ok(safeTask);
            const envelpoSchema = okEnvelopeSchema(safeTaskSchema);
            const validatedEnvelop = validateResponse(envelpoSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.listByColumn = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id
            };
            const tasks = await this.taskService.listByColumn(ctx);
            const safeTasks = tasks.map((task) => ({
                id: task.id,
                projectId: task.projectId,
                columnId: task.columnId,
                title: task.title,
                priority: task.priority,
                position: task.position,
                createdBy: task.createdBy,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                description: task.description ?? "",
                dueDate: task.dueDate ?? undefined
            }));
            const envelop = ok(safeTasks);
            const envelopSchema = okEnvelopeSchema(safeTasksSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.update = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id
            };
            const task = await this.taskService.update(req.body, ctx);
            const safeTask = {
                id: task.id,
                projectId: task.projectId,
                columnId: task.columnId,
                title: task.title,
                priority: task.priority,
                position: task.position,
                createdBy: task.createdBy,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                description: task.description ?? "",
                dueDate: task.dueDate ?? undefined
            };
            const envelop = ok(safeTask);
            const envelopSchema = okEnvelopeSchema(safeTaskSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.reOrder = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id
            };
            const tasks = await this.taskService.reOrder(req.body, ctx);
            const safeTasks = tasks.map((task) => ({
                id: task.id,
                projectId: task.projectId,
                columnId: task.columnId,
                title: task.title,
                priority: task.priority,
                position: task.position,
                createdBy: task.createdBy,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                description: task.description ?? "",
                dueDate: task.dueDate ?? undefined
            }));
            const envelop = ok(safeTasks);
            const envelopSchema = okEnvelopeSchema(safeTasksSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.remove = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id
            };
            const task = await this.taskService.remove(ctx);
            const safeTask = {
                id: task.id,
                projectId: task.projectId,
                columnId: task.columnId,
                title: task.title,
                priority: task.priority,
                position: task.position,
                createdBy: task.createdBy,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                description: task.description ?? "",
                dueDate: task.dueDate ?? undefined
            };
            const envelop = ok(safeTask);
            const envelopSchema = okEnvelopeSchema(safeTaskSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.bulkRemove = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id
            };
            const tasks = await this.taskService.bulkRemove(req.body, ctx);
            const safeTasks = tasks.map((task) => ({
                id: task.id,
                projectId: task.projectId,
                columnId: task.columnId,
                title: task.title,
                priority: task.priority,
                position: task.position,
                createdBy: task.createdBy,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                description: task.description ?? "",
                dueDate: task.dueDate ?? undefined
            }));
            const envelop = ok(safeTasks);
            const envelopSchema = okEnvelopeSchema(safeTasksSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.assign = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id
            };
            const assignee = await this.taskService.assign(req.body, ctx);
            const safeAssignee = {
                taskId: assignee.taskId,
                userId: assignee.taskId
            };
            const envelop = created(safeAssignee);
            const envelopSchema = createdEnvelopeSchema(safeAssigneeSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
        };
        this.archivTask = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id
            };
            const task = await this.taskService.archivTask(ctx);
            const safeTask = {
                id: task.id,
                projectId: task.projectId,
                columnId: task.columnId,
                title: task.title,
                priority: task.priority,
                position: task.position,
                createdBy: task.createdBy,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                description: task.description ?? "",
                dueDate: task.dueDate ?? undefined
            };
            const envelop = ok(safeTask);
            const envelopSchema = okEnvelopeSchema(safeTaskSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.restoreTask = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id
            };
            const task = await this.taskService.restoreTask(ctx);
            const safeTask = {
                id: task.id,
                projectId: task.projectId,
                columnId: task.columnId,
                title: task.title,
                priority: task.priority,
                position: task.position,
                createdBy: task.createdBy,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                description: task.description ?? "",
                dueDate: task.dueDate ?? undefined
            };
            const envelop = ok(safeTask);
            const envelopSchema = okEnvelopeSchema(safeTaskSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
    }
    ;
}
