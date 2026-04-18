import type { ActionFunctionArgs } from "react-router-dom";
import { projectApi } from "../project.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";

export async function UpdateProjectAction({ params, request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const projectId = params.projectId;
    const workspaceId = params.workspaceId;

    const data: unknown = {
        name: formData.get('name'),
        description: formData.get('description'),
    }

    try {
        const promise = projectApi.update(workspaceId, projectId, data);

        notify.promise(promise, {
            loading: "Updating project... ",
            success: feedbackMessage.project.updateSuccess,
            error: feedbackMessage.project.updateFailed
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
    }
}