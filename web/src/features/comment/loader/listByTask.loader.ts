import type { LoaderFunctionArgs } from "react-router-dom";
import { commentApi } from "../comment.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { ZodError } from "../../../../../api/src/docs/zod";
import { z } from "zod/mini";

export async function ListByTaskLoader({ params }: LoaderFunctionArgs) {
    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        columnId: params.columnId,
        taskId: params.taskId
    };

    try {
        const promise = commentApi.listByTask(paramsData);

        notify.promise(promise, {
            loading: "Loading comments... ",
            success: feedbackMessage.comment.listByTaskSuccess,
            error: feedbackMessage.comment.listByTaskFailed
        });

        return await promise;
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
