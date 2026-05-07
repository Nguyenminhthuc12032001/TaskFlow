import type { Request, Response } from 'express';
import type { WorkspaceParamsType } from '../../common/schemas/common.schemas.js';
import {
  safeAssigneeSchema,
  safeTaskDetailSchema,
  safeTaskSchema,
  safeTasksSchema,
  type AssignBodyType,
  type BulkRemoveBodyType,
  type CreateBodyType,
  type ReOrderBodyType,
  type SafeAssignee,
  type SafeTaskDetail,
  type SafeTask,
  type SafeTasks,
  type UpdateBodyType,
  type ListTaskByColumnQueryType,
  listTaskByColumnQuerySchema,
} from './task.schemas.js';
import type { TaskService } from './task.service.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import {
  created,
  createdEnvelopeSchema,
  ok,
  okEnvelopeSchema,
} from '../../common/utils/response/format.js';
import { validateResponse } from '../../common/utils/response/validate.js';
import { paginationQuerySchema, type PaginationQueryType } from '../../common/schemas/common.schemas.js';

type TaskResponseSource = Omit<SafeTask, 'description' | 'dueDate' | 'assignees'> & {
  description: string | null;
  dueDate: Date | null;
  assignees?: Array<{
    taskId: string;
    userId: string;
  }>;
};

type TaskDetailResponseSource = Omit<TaskResponseSource, 'assignees'> & {
  assignees: Array<{
    taskId: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};

const toSafeTask = (task: TaskResponseSource): SafeTask => ({
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

const toSafeTaskDetail = (task: TaskDetailResponseSource): SafeTaskDetail => ({
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
  constructor(readonly taskService: TaskService) { }

  create = async (req: Request<WorkspaceParamsType, {}, CreateBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      ActorId: req.user!.id,
    };

    const task = await this.taskService.create(req.body, ctx);

    const safeTask = toSafeTask(task);

    const envelope = created(safeTask);
    const envelopeSchema = createdEnvelopeSchema(safeTaskSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(201).json(validatedEnvelope);
  };

  get = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const task = await this.taskService.get(ctx);

    const safeTask = toSafeTaskDetail(task);

    const envelope = ok(safeTask);
    const envelopeSchema = okEnvelopeSchema(safeTaskDetailSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  listByColumn = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const listTaskByColumnQuery: ListTaskByColumnQueryType = listTaskByColumnQuerySchema.parse(req.query);

    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      ActorId: req.user!.id,
    };

    const { tasks, paginationMeta } = await this.taskService.listByColumn(ctx, listTaskByColumnQuery);

    const safeTasks: SafeTasks = {
      data:
        tasks.map(toSafeTask),
      paginationMeta
    };

    const envelope = ok(safeTasks);
    const envelopeSchema = okEnvelopeSchema(safeTasksSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  update = async (req: Request<WorkspaceParamsType, {}, UpdateBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const task = await this.taskService.update(req.body, ctx);

    const safeTask = toSafeTask(task);

    const envelope = ok(safeTask);
    const envelopeSchema = okEnvelopeSchema(safeTaskSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  reOrder = async (req: Request<WorkspaceParamsType, {}, ReOrderBodyType, {}, {}>, res: Response) => {
    const paginationQuery: PaginationQueryType = paginationQuerySchema.parse(req.query);

    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      ActorId: req.user!.id,
    };

    const { tasks, paginationMeta } = await this.taskService.reOrder(req.body, ctx, paginationQuery);

    const safeTasks: SafeTasks = {
      data: tasks.map(toSafeTask),
      paginationMeta
    };

    const envelope = ok(safeTasks);
    const envelopeSchema = okEnvelopeSchema(safeTasksSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  remove = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const task = await this.taskService.remove(ctx);

    const safeTask = toSafeTask(task);

    const envelope = ok(safeTask);
    const envelopeSchema = okEnvelopeSchema(safeTaskSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  bulkRemove = async (
    req: Request<WorkspaceParamsType, {}, BulkRemoveBodyType, {}, {}>,
    res: Response,
  ) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      ActorId: req.user!.id,
    };

    const tasks = await this.taskService.bulkRemove(req.body, ctx);

    const safeTasks: SafeTasks = {
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

  assign = async (req: Request<WorkspaceParamsType, {}, AssignBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const assignee = await this.taskService.assign(req.body, ctx);

    const safeAssignee: SafeAssignee = {
      taskId: assignee.taskId,
      userId: assignee.userId,
    };

    const envelope = created(safeAssignee);
    const envelopeSchema = createdEnvelopeSchema(safeAssigneeSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(201).json(validatedEnvelope);
  };

  archivTask = async (req: Request<WorkspaceParamsType, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const task = await this.taskService.archivTask(ctx);

    const safeTask = toSafeTask(task);

    const envelope = ok(safeTask);
    const envelopeSchema = okEnvelopeSchema(safeTaskSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  restoreTask = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const task = await this.taskService.restoreTask(ctx);

    const safeTask = toSafeTask(task);

    const envelope = ok(safeTask);
    const envelopeSchema = okEnvelopeSchema(safeTaskSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };
}
