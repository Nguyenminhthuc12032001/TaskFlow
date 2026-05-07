import { safeAssigneeSchema, safeTaskDetailSchema, safeTaskSchema, safeTasksSchema, listTaskByColumnQuerySchema, } from './task.schemas.js';
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema, } from '../../common/utils/response/format.js';
import { validateResponse } from '../../common/utils/response/validate.js';
import { paginationQuerySchema } from '../../common/schemas/common.schemas.js';
const toSafeTask = (task) => ({
    id: task.id,
    projectId: task.projectId,
    columnId: task.columnId,
    title: task.title,
    priority: task.priority,
    position: task.position,
    createdBy: task.createdBy,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    description: task.description ?? '',
    dueDate: task.dueDate ?? undefined,
    assignees: task.assignees?.map((assignee) => ({
        taskId: assignee.taskId,
        userId: assignee.userId,
    })),
});
const toSafeTaskDetail = (task) => ({
    ...toSafeTask(task),
    assignees: task.assignees.map((assignee) => ({
        taskId: assignee.taskId,
        userId: assignee.userId,
        user: {
            id: assignee.user.id,
            name: assignee.user.name,
            email: assignee.user.email,
        },
    })),
});
export class TaskController {
    constructor(taskService) {
        this.taskService = taskService;
        this.create = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id,
            };
            const task = await this.taskService.create(req.body, ctx);
            const safeTask = toSafeTask(task);
            const envelope = created(safeTask);
            const envelopeSchema = createdEnvelopeSchema(safeTaskSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(201).json(validatedEnvelope);
        };
        this.get = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const task = await this.taskService.get(ctx);
            const safeTask = toSafeTaskDetail(task);
            const envelope = ok(safeTask);
            const envelopeSchema = okEnvelopeSchema(safeTaskDetailSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.listByColumn = async (req, res) => {
            const listTaskByColumnQuery = listTaskByColumnQuerySchema.parse(req.query);
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id,
            };
            const { tasks, paginationMeta } = await this.taskService.listByColumn(ctx, listTaskByColumnQuery);
            const safeTasks = {
                data: tasks.map(toSafeTask),
                paginationMeta
            };
            const envelope = ok(safeTasks);
            const envelopeSchema = okEnvelopeSchema(safeTasksSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.update = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const task = await this.taskService.update(req.body, ctx);
            const safeTask = toSafeTask(task);
            const envelope = ok(safeTask);
            const envelopeSchema = okEnvelopeSchema(safeTaskSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.reOrder = async (req, res) => {
            const paginationQuery = paginationQuerySchema.parse(req.query);
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id,
            };
            const { tasks, paginationMeta } = await this.taskService.reOrder(req.body, ctx, paginationQuery);
            const safeTasks = {
                data: tasks.map(toSafeTask),
                paginationMeta
            };
            const envelope = ok(safeTasks);
            const envelopeSchema = okEnvelopeSchema(safeTasksSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.remove = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const task = await this.taskService.remove(ctx);
            const safeTask = toSafeTask(task);
            const envelope = ok(safeTask);
            const envelopeSchema = okEnvelopeSchema(safeTaskSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.bulkRemove = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                ActorId: req.user.id,
            };
            const tasks = await this.taskService.bulkRemove(req.body, ctx);
            const safeTasks = {
                data: tasks.map(toSafeTask),
                paginationMeta: {
                    page: 1,
                    limit: tasks.length,
                    totalItems: tasks.length,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                }
            };
            const envelope = ok(safeTasks);
            const envelopeSchema = okEnvelopeSchema(safeTasksSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.assign = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const assignee = await this.taskService.assign(req.body, ctx);
            const safeAssignee = {
                taskId: assignee.taskId,
                userId: assignee.userId,
            };
            const envelope = created(safeAssignee);
            const envelopeSchema = createdEnvelopeSchema(safeAssigneeSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(201).json(validatedEnvelope);
        };
        this.archivTask = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const task = await this.taskService.archivTask(ctx);
            const safeTask = toSafeTask(task);
            const envelope = ok(safeTask);
            const envelopeSchema = okEnvelopeSchema(safeTaskSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
        this.restoreTask = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const task = await this.taskService.restoreTask(ctx);
            const safeTask = toSafeTask(task);
            const envelope = ok(safeTask);
            const envelopeSchema = okEnvelopeSchema(safeTaskSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(200).json(validatedEnvelope);
        };
    }
}
