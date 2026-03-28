import type { Request, Response } from 'express';
import type { WorkspaceParams } from '../../common/middlewares/requireWorkspaceRole.middleware.js';
import {
  safeCommentSchema,
  safeCommentsSchema,
  type CreateBodyType,
  type SafeCommentsType,
  type SafeCommentType,
  type UpdateBodyType,
} from './comment.schemas.js';
import type { CommentService } from './comment.service.js';
import type { ResourceContext } from '../../common/types/common.types.js';
import {
  created,
  createdEnvelopeSchema,
  ok,
  okEnvelopeSchema,
} from '../../common/utils/response/format.js';
import { validateResponse } from '../../common/utils/response/validate.js';

export class CommentController {
  constructor(readonly commentService: CommentService) {}

  create = async (req: Request<WorkspaceParams, {}, CreateBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const comment = await this.commentService.create(req.body, ctx);

    const safeComment: SafeCommentType = {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    const envelop = created(safeComment);
    const envelopSchema = createdEnvelopeSchema(safeCommentSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(201).json(validatedEnvelop);
  };

  get = async (req: Request<WorkspaceParams, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      CommentId: req.params.commentId!,
      ActorId: req.user!.id,
    };

    const comment = await this.commentService.get(ctx);

    const safeComment: SafeCommentType = {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      parentId: comment.parentId ?? '',
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    const envelop = ok(safeComment);
    const envelopSchema = okEnvelopeSchema(safeCommentSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };

  listByTask = async (req: Request<WorkspaceParams, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const comments = await this.commentService.listByTask(ctx);

    const safeComments: SafeCommentsType = comments.map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      parentId: comment.parentId ?? '',
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    const envelop = ok(safeComments);
    const envelopSchema = okEnvelopeSchema(safeCommentsSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };

  update = async (req: Request<WorkspaceParams, {}, UpdateBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      CommentId: req.params.commentId!,
      ActorId: req.user!.id,
    };

    const comment = await this.commentService.update(req.body, ctx);

    const safeComment: SafeCommentType = {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      parentId: comment.parentId ?? '',
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    const envelop = ok(safeComment);
    const envelopSchema = okEnvelopeSchema(safeCommentSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };

  reply = async (req: Request<WorkspaceParams, {}, CreateBodyType, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      CommentId: req.params.commentId!,
      ActorId: req.user!.id,
    };

    const comment = await this.commentService.reply(req.body, ctx);

    const safeComment: SafeCommentType = {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      parentId: comment.parentId!,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    const envelop = created(safeComment);
    const envelopSchema = createdEnvelopeSchema(safeCommentSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(201).json(validatedEnvelop);
  };

  remove = async (req: Request<WorkspaceParams, {}, {}, {}, {}>, res: Response) => {
    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      CommentId: req.params.commentId!,
      ActorId: req.user!.id,
    };

    const comment = await this.commentService.remove(ctx);

    const safeComment: SafeCommentType = {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      parentId: comment.parentId ?? '',
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    const envelop = ok(safeComment);
    const envelopSchema = okEnvelopeSchema(safeCommentSchema);
    const validatedEnvelop = validateResponse(envelopSchema)(envelop);

    return res.status(200).json(validatedEnvelop);
  };
}
