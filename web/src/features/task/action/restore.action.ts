import { redirect, type ActionFunctionArgs } from "react-router-dom";
import { taskApi } from "../task.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function ReStoreTaskAction({ params }: ActionFunctionArgs) {
    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        columnId: params.columnId,
        taskId: params.taskId
    };

    try {
        const promise = taskApi.reStore(paramsData); 

        notify.promise(promise, {
            loading: "Restoring task... ",
            success: feedbackMessage.task.reStoreSuccess,
            error: feedbackMessage.task.reStoreFailed
        });

        await promise;

        return redirect(`/workspaces/${params.workspaceId}/projects/${params.projectId}/columns/${params.columnId}/tasks`);
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
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
            } satisfies ActionError 
        }

        throw error;
    }
}