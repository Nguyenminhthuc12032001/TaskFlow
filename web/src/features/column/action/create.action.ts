import { redirect, type ActionFunctionArgs } from "react-router-dom";
import { columnApi } from "../column.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function CreateColumnAction({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();

    const projectId = params.projectId;
    const workspaceId = params.workspaceId;

    const data: unknown = {
        name: formData.get('name'),
        type: formData.get('type'),
    }

    try {
        const promise = columnApi.create(workspaceId, projectId, data);

        notify.promise(promise, {
            loading: "Creating column... ",
            success: feedbackMessage.column.createSuccess,
            error: feedbackMessage.column.createFailed
        });
        
        await promise;

        return redirect(`/board/workspaces/${workspaceId}/projects/${projectId}/columns`);
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
            const { fieldErrors, formErrors } = z.flattenError(error);
            return {
                fieldErrors,
                formErrors
            } satisfies ActionError
        }

        throw error;
    }
}