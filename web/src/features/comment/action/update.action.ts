import type { ActionFunctionArgs } from "react-router-dom";
import { commentApi } from "../comment.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import type { ActionError } from "../../type"; 
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import z, { ZodError } from "../../../../../api/src/docs/zod";

export async function UpdateCommentAction({ params, request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        columnId: params.columnId,
        taskId: params.taskId,
        commentId: params.commentId
    };

    const data: unknown = {
        content: formData.get('content')
    };

    try {
        const promise = commentApi.update(paramsData, data);

        notify.promise(promise, {
            loading: "Updating comment... ",
            success: feedbackMessage.comment.updateSuccess,
            error: feedbackMessage.comment.updateFailed 
        });

        await promise;

        return null;
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode),
                    errorMessage: error.message
                } satisfies ActionError
            }

            if (error.status === 403 || error.status === 404) {
                return {
                    errorMessage: error.message
                } satisfies ActionError
            }
        }

        if (error instanceof ZodError) {
            const { formErrors, fieldErrors } = z.flattenError(error);

            return {
                formErrors,
                fieldErrors
            } satisfies ActionError
        }

        throw error;
    }
    
}
