import type { Request, Response } from 'express';
import type { WorkspaceParamsType } from '../../common/schemas/common.schemas.js';
import {
  safeAssigneeSchema,
  safeTaskSchema,
  safeTasksSchema,
  type AssignBodyType,
  type BulkRemoveBodyType,
  type CreateBodyType,
  type ReOrderBodyType,
  type SafeAssignee,
  type SafeTask,
  type SafeTasks,
  type UpdateBodyType,
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

    const safeTask: SafeTask = {
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
    };

    const envelop = created(safeTask);
    const envelopSchema = createdEnvelopeSchema(safeTaskSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(201).json(validatedEnvelop);
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

    const safeTask: SafeTask = {
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
    };

    const envelop = ok(safeTask);
    const envelpoSchema = okEnvelopeSchema(safeTaskSchema);
    const validatedEnvelop = validateResponse(envelpoSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };

  listByColumn = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response) => {
    const paginationQuery: PaginationQueryType = paginationQuerySchema.parse(req.query);

    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      ActorId: req.user!.id,
    };

    const { tasks, paginationMeta } = await this.taskService.listByColumn(ctx, paginationQuery);

    const safeTasks: SafeTasks = {
      data:
        tasks.map((task) => ({
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
        })),
      paginationMeta
    };

    const envelop = ok(safeTasks);
    const envelopSchema = okEnvelopeSchema(safeTasksSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
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

    const safeTask: SafeTask = {
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
    };

    const envelop = ok(safeTask);
    const envelopSchema = okEnvelopeSchema(safeTaskSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
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
      data: tasks.map((task) => ({
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
      })),
      paginationMeta
    };

    const envelop = ok(safeTasks);
    const envelopSchema = okEnvelopeSchema(safeTasksSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
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

    const safeTask: SafeTask = {
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
    };

    const envelop = ok(safeTask);
    const envelopSchema = okEnvelopeSchema(safeTaskSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
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
      data: tasks.map((task) => ({
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
      })),
      paginationMeta: {
          page: 1,
          limit: tasks.length,
          totalItems: tasks.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
      }
    };

    const envelop = ok(safeTasks);
    const envelopSchema = okEnvelopeSchema(safeTasksSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
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
      userId: assignee.taskId,
    };

    const envelop = created(safeAssignee);
    const envelopSchema = createdEnvelopeSchema(safeAssigneeSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(201).json(validatedEnvelop);
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

    const safeTask: SafeTask = {
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
    };

    const envelop = ok(safeTask);
    const envelopSchema = okEnvelopeSchema(safeTaskSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
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

    const safeTask: SafeTask = {
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
    };

    const envelop = ok(safeTask);
    const envelopSchema = okEnvelopeSchema(safeTaskSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };
}
