import type { ActionFunctionArgs } from "react-router-dom";
import { projectApi } from "../project.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod"; 

export async function DeleteAction({ params }: ActionFunctionArgs) {
    const workspaceId = params.workspaceId;
    const projectId = params.projectId;

    try {
        const promise = projectApi.delete(workspaceId, projectId);
        notify.promise(promise, {
            loading: "Deleting project... ",
            success: feedbackMessage.project.deleteSuccess,
            error: feedbackMessage.project.deleteFailed
        });

        const project = await promise;

        return project;
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
            const { fieldErrors, formErrors } = z.flattenError(error);

            return {
                fieldErrors,
                formErrors
            } satisfies ActionError
        }

        throw error;
    }
}