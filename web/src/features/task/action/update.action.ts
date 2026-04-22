import { taskApi } from "../task.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { redirect, type ActionFunctionArgs } from "react-router-dom";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function UpdateTaskAction({ params, request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        columnId: params.columnId,
        taskId: params.taskId
    };

    const data: unknown = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate'),
    };

    try {
        const promise = taskApi.update(paramsData, data);

        notify.promise(promise, {
            loading: "Updating task... ",
            success: feedbackMessage.task.updateSuccess,
            error: feedbackMessage.task.updateFailed
        });

        await promise;

        return redirect(`/workspaces/${params.workspaceId}/projects/${params.projectId}/columns/${params.columnId}/tasks/${params.taskId}`);
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

            if (error.status === 409) {
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