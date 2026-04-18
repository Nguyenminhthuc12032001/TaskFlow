import type { ActionFunctionArgs } from "react-router-dom";
import { columnApi } from "../column.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function DeleteColumnAction({ params }: ActionFunctionArgs) {
    const workspaceId = params.workspaceId;
    const projectId = params.projectId;
    const columnId = params.columnId;

    try {
        const promise = columnApi.delete(workspaceId, projectId, columnId);

        notify.promise(promise, {add
            loading: "Deleting column... ",
            success: feedbackMessage.column.deleteSuccess,
            error: feedbackMessage.column.deleteFailed
        });

        await promise;
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