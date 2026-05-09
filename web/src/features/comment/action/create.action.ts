import type { ActionFunctionArgs } from "react-router-dom";
import { commentApi } from "../comment.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import { ZodError, z } from "zod";
import type { ActionError } from "../../type";

export async function CreateCommentAction({ params, request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const resetKeyValue = formData.get("resetKey");
    const resetKey = typeof resetKeyValue === "string" ? resetKeyValue : "initial";

    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        columnId: params.columnId,
        taskId: params.taskId
    };

    const data: unknown = {
        content: formData.get('content')
    };

    try {
        const promise = commentApi.create(paramsData, data);

        notify.promise(promise, {
            loading: "Creating comment... ",
            success: feedbackMessage.comment.createSuccess,
            error: feedbackMessage.comment.createFailed
        });

        await promise;

        return { resetKey: crypto.randomUUID() };
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
                    resetKey,
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode),
                    errorMessage: error.message
                } satisfies ActionError & { resetKey: string }
            }

            if (error.status === 403 || error.status === 404) {
                return {
                    resetKey,
                    errorMessage: error.message
                } satisfies ActionError & { resetKey: string }
            }
        }

        if (error instanceof ZodError) {
            const { formErrors, fieldErrors } = z.flattenError(error);

            return {
                resetKey,
                formErrors,
                fieldErrors
            } satisfies ActionError & { resetKey: string };
        }

        throw error;
    }
}
