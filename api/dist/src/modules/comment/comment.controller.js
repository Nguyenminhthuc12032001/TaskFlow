import { safeCommentSchema, safeCommentsSchema } from "./comment.schemas.js";
import { created, createdEnvelopeSchema, ok, okEnvelopeSchema } from "../../common/utils/response/format.js";
import { validateResponse } from "../../common/utils/response/validate.js";
export class CommentController {
    constructor(commentService) {
        this.commentService = commentService;
        this.create = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id
            };
            const comment = await this.commentService.create(req.body, ctx);
            const safeComment = {
                id: comment.id,
                taskId: comment.taskId,
                authorId: comment.authorId,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            };
            const envelop = created(safeComment);
            const envelopSchema = createdEnvelopeSchema(safeCommentSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
        };
        this.get = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                CommentId: req.params.commentId,
                ActorId: req.user.id
            };
            const comment = await this.commentService.get(ctx);
            const safeComment = {
                id: comment.id,
                taskId: comment.taskId,
                authorId: comment.authorId,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            };
            const envelop = ok(safeComment);
            const envelopSchema = okEnvelopeSchema(safeCommentSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.listByTask = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                ActorId: req.user.id
            };
            const comments = await this.commentService.listByTask(ctx);
            const safeComments = comments.map((comment) => ({
                id: comment.id,
                taskId: comment.taskId,
                authorId: comment.authorId,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }));
            const envelop = ok(safeComments);
            const envelopSchema = okEnvelopeSchema(safeCommentsSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.update = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                CommentId: req.params.commentId,
                ActorId: req.user.id
            };
            const comment = await this.commentService.update(req.body, ctx);
            const safeComment = {
                id: comment.id,
                taskId: comment.taskId,
                authorId: comment.authorId,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            };
            const envelop = ok(safeComment);
            const envelopSchema = okEnvelopeSchema(safeCommentSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
        this.reply = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                CommentId: req.params.commentId,
                ActorId: req.user.id
            };
            const comment = await this.commentService.reply(req.body, ctx);
            const safeComment = {
                id: comment.id,
                taskId: comment.taskId,
                authorId: comment.authorId,
                parentId: comment.parentId,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            };
            const envelop = created(safeComment);
            const envelopSchema = createdEnvelopeSchema(safeCommentSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(201).json(validatedEnvelop);
        };
        this.remove = async (req, res) => {
            const ctx = {
                workspaceId: req.params.workspaceId,
                projectId: req.params.projectId,
                columnId: req.params.columnId,
                TaskId: req.params.taskId,
                CommentId: req.params.commentId,
                ActorId: req.user.id
            };
            const comment = await this.commentService.remove(ctx);
            const safeComment = {
                id: comment.id,
                taskId: comment.taskId,
                authorId: comment.authorId,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            };
            const envelop = ok(safeComment);
            const envelopSchema = okEnvelopeSchema(safeCommentSchema);
            const validatedEnvelop = validateResponse(envelopSchema)(envelop);
            return res.status(200).json(validatedEnvelop);
        };
    }
    ;
}
;
