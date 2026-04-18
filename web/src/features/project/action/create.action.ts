import { redirect, type ActionFunctionArgs } from "react-router-dom";
import { projectApi } from "../project.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import z, { ZodError } from "zod";

export async function CreateProjectAction({ params, request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const workspaceId = params.workspaceId;

    const data: unknown = {
        name: formData.get('name'),
        description: formData.get('description'),
    } 

    try {
        const promise = projectApi.create(workspaceId, data);

        notify.promise(promise, {
            loading: "Creating project... ",
            success: feedbackMessage.project.createSuccess,
            error: feedbackMessage.project.createFailed
        });

        const project = await promise;

        return redirect(`/board/workspaces/${workspaceId}/projects/${project.id}`);
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
            const { formErrors, fieldErrors } = z.flattenError(error)
            return {
                formErrors,
                fieldErrors
            } satisfies ActionError
        }

        throw error;
    }
}