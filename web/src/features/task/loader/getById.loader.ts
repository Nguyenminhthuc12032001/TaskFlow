import type { LoaderFunctionArgs } from "react-router-dom";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { notify } from "../../../app/shared/lib/notify";
import { taskApi } from "../task.api";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function GetTaskByIdLoader({ params }: LoaderFunctionArgs) {
    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        columnId: params.columnId,
        taskId: params.taskId
    };

    try {
        const promise = taskApi.getById(paramsData);

        notify.promise(promise, {
            loading: "Loading task... ",
            success: feedbackMessage.task.getByIdSuccess,
            error: feedbackMessage.task.getByIdFailed
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