import type { ActionFunctionArgs } from "react-router-dom";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import { notify } from "../../../app/shared/lib/notify";
import type { ActionError } from "../../type";
import { taskApi } from "../task.api";
import { z, ZodError } from "zod";

export async function DeleteTaskAction({ params, request }: ActionFunctionArgs) {
    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        columnId: params.columnId,
        taskId: params.taskId
    };

    const formData = await request.formData();

    try {
        const promise = taskApi.bulkDelete(paramsData, formData);

        notify.promise(promise, {
            loading: "Deleting tasks... ",
            success: feedbackMessage.task.bulkDeleteSuccess,
            error: feedbackMessage.task.bulkDeleteFailed
        });

        await promise; 
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode),
                    errorMessage: error.message
                } satisfies ActionError
            }

            if (error.status === 403) {
                return {
                    errorMessage: error.message
                } satisfies ActionError
            }

            if (error.status === 404) {
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
            } satisfies ActionError;
        }

        throw error;
    }
}