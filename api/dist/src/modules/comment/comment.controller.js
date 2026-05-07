import { listCommentsQuerySchema, safeCommentSchema, safeCommentsSchema, } from './comment.schemas.js';
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema, } from '../../common/utils/response/format.js';
import { validateResponse } from '../../common/utils/response/validate.js';
export class CommentController {
    constructor(commentService) {
        this.commentService = commentService;
        this.create = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const comment = await this.commentService.create(req.body, ctx);
            const safeComment = {
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
        this.get = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                CommentId: req.params.commentId,
                ActorId: req.user.id,
            };
            const comment = await this.commentService.get(ctx);
            const safeComment = {
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
        this.listByTask = async (req, res) => {
            const listCommentsQuery = listCommentsQuerySchema.parse(req.query);
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id,
            };
            const { comments, paginationMeta } = await this.commentService.listByTask(ctx, listCommentsQuery);
            const safeComments = {
                data: comments.map((comment) => ({
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
        this.update = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                CommentId: req.params.commentId,
                ActorId: req.user.id,
            };
            const comment = await this.commentService.update(req.body, ctx);
            const safeComment = {
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
        this.reply = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                CommentId: req.params.commentId,
                ActorId: req.user.id,
            };
            const comment = await this.commentService.reply(req.body, ctx);
            const safeComment = {
                id: comment.id,
                taskId: comment.taskId,
                authorId: comment.authorId,
                parentId: comment.parentId,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
            };
            const envelope = created(safeComment);
            const envelopeSchema = createdEnvelopeSchema(safeCommentSchema);
            const validatedEnvelope = validateResponse(envelopeSchema)(envelope);
            return res.status(201).json(validatedEnvelope);
        };
        this.remove = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                CommentId: req.params.commentId,
                ActorId: req.user.id,
            };
            const comment = await this.commentService.remove(ctx);
            const safeComment = {
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
}
