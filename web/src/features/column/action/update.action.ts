import type { ActionFunctionArgs } from "react-router-dom";
import { columnApi } from "../column.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function UpdateColumnAction({ params, request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const columnId = params.columnId;
    const projectId = params.projectId;
    const workspaceId = params.workspaceId;

    const data: unknown = {
        name: formData.get('name'), 
    };
    
    try {
        const promise = columnApi.update(workspaceId, projectId, columnId, data);

        notify.promise(promise, {
            loading: "Updating column... ",
            success: feedbackMessage.column.updateSuccess,
            error: feedbackMessage.column.updateFailed
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
            } satisfies ActionError
        }

        throw error;
    }
}