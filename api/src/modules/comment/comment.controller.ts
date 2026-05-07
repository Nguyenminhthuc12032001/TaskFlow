import type { Request, Response } from 'express';
import { type WorkspaceParamsType } from '../../common/schemas/common.schemas.js';
import {
  listCommentsQuerySchema,
  safeCommentSchema,
  safeCommentsSchema,
  type CreateBodyType,
  type ListCommentsQueryType,
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
  constructor(readonly commentService: CommentService) { }

  create = async (req: Request<WorkspaceParamsType, {}, CreateBodyType, {}, {}>, res: Response): Promise<Response> => {
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

    const envelope = created(safeComment);
    const envelopeSchema = createdEnvelopeSchema(safeCommentSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(201).json(validatedEnvelope);
  };

  get = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response): Promise<Response> => {
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
      parentId: comment.parentId ?? undefined,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    const envelope = ok(safeComment);
    const envelopeSchema = okEnvelopeSchema(safeCommentSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  listByTask = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response): Promise<Response> => {
    const listCommentsQuery: ListCommentsQueryType = listCommentsQuerySchema.parse(req.query);

    const ctx: ResourceContext = {
      workspaceId: req.params.workspaceId,
      projectId: req.params.projectId!,
      columnId: req.params.columnId!,
      TaskId: req.params.taskId!,
      ActorId: req.user!.id,
    };

    const { comments, paginationMeta } = await this.commentService.listByTask(ctx, listCommentsQuery);

    const safeComments: SafeCommentsType = {
      data:
        comments.map((comment) => ({
          id: comment.id,
          taskId: comment.taskId,
          authorId: comment.authorId,
          parentId: comment.parentId ?? undefined,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        })),
      paginationMeta,
    };

    const envelope = ok(safeComments);
    const envelopeSchema = okEnvelopeSchema(safeCommentsSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  update = async (req: Request<WorkspaceParamsType, {}, UpdateBodyType, {}, {}>, res: Response): Promise<Response> => {
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
      parentId: comment.parentId ?? undefined,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    const envelope = ok(safeComment);
    const envelopeSchema = okEnvelopeSchema(safeCommentSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };

  reply = async (req: Request<WorkspaceParamsType, {}, CreateBodyType, {}, {}>, res: Response): Promise<Response> => {
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

    const envelope = created(safeComment);
    const envelopeSchema = createdEnvelopeSchema(safeCommentSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(201).json(validatedEnvelope);
  };

  remove = async (req: Request<WorkspaceParamsType, {}, {}, {}, {}>, res: Response): Promise<Response> => {
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
      parentId: comment.parentId ?? undefined,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    const envelope = ok(safeComment);
    const envelopeSchema = okEnvelopeSchema(safeCommentSchema);
    const validatedEnvelope = validateResponse(envelopeSchema)(envelope);

    return res.status(200).json(validatedEnvelope);
  };
}
