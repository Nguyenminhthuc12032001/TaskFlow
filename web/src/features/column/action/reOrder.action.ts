import type { ActionFunctionArgs } from "react-router-dom"; 
import { notify } from "../../../app/shared/lib/notify";
import { columnApi } from "../column.api";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function ReOrderColumnAction({ params, request }: ActionFunctionArgs) {
    const formData = await request.formData(); 

    const projectId = params.projectId;
    const workspaceId = params.workspaceId;

    const rawItems = formData.get('items'); 

    if (typeof rawItems !== 'string') {
        return {
            errorMessage: 'Invalid items'
        } satisfies ActionError
    }

    const data: unknown = JSON.parse(rawItems);

    try {
        const promise = columnApi.reOrder(workspaceId, projectId, data);

        notify.promise(promise, {
            loading: "Updating column...",
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