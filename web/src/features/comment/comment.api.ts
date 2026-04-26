import { workspaceParamsSchema } from "../../../../api/src/common/schemas/common.schemas";
import { createdEnvelopeSchema, okEnvelopeSchema } from "../../../../api/src/common/utils/response/format";
import { createBodySchema, safeCommentSchema, safeCommentsSchema, updateBodySchema } from "../../../../api/src/modules/comment/comment.schemas";
import { http } from "../../app/shared/lib/http-interceptors";
import { validate } from "../../app/shared/lib/validate";

export const commentApi = {
    create: async (ctx: unknown, data: unknown) => {
        const validatedCtx = validate(workspaceParamsSchema)(ctx);
        const validatedData = validate(createBodySchema)(data);

        const response = await http.post(`/comments/${validatedCtx.workspaceId}/${validatedCtx.projectId}/${validatedCtx.columnId}/${validatedCtx.taskId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeCommentSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    reply: async (ctx: unknown, data: unknown) => {
        const validatedCtx = validate(workspaceParamsSchema)(ctx);
        const validatedData = validate(createBodySchema)(data);

        const response = await http.post(`/comments/${validatedCtx.workspaceId}/${validatedCtx.projectId}/${validatedCtx.columnId}/${validatedCtx.taskId}/${validatedCtx.commentId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = createdEnvelopeSchema(safeCommentSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    getById: async (ctx: unknown) => {
        const validatedCtx = validate(workspaceParamsSchema)(ctx);

        const response = await http.get(`/comments/${validatedCtx.workspaceId}/${validatedCtx.projectId}/${validatedCtx.columnId}/${validatedCtx.taskId}/${validatedCtx.commentId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeCommentSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    listByTask: async (ctx: unknown) => {
        const validatedCtx = validate(workspaceParamsSchema)(ctx);

        const response = await http.get(`/comments/${validatedCtx.workspaceId}/${validatedCtx.projectId}/${validatedCtx.columnId}/${validatedCtx.taskId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeCommentsSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    update: async (ctx: unknown, data: unknown) => {
        const validatedCtx = validate(workspaceParamsSchema)(ctx);
        const validatedData = validate(updateBodySchema)(data);

        const response = await http.patch(`/comments/${validatedCtx.workspaceId}/${validatedCtx.projectId}/${validatedCtx.columnId}/${validatedCtx.taskId}/${validatedCtx.commentId}`, validatedData);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeCommentSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    },

    delete: async (ctx: unknown) => {
        const validatedCtx = validate(workspaceParamsSchema)(ctx);

        const response =  await http.delete(`/comments/${validatedCtx.workspaceId}/${validatedCtx.projectId}/${validatedCtx.columnId}/${validatedCtx.taskId}/${validatedCtx.commentId}`);

        const envelop = response.data;
        const envelopSchema = okEnvelopeSchema(safeCommentSchema);
        const validatedEnvelop = validate(envelopSchema)(envelop);

        return validatedEnvelop.data;
    }
}
