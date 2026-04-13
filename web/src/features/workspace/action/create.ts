import { redirect } from "react-router-dom";
import { workspaceApi } from "../workspace.api";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { notify } from "../../../app/shared/lib/notify";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import z, { ZodError } from "zod";

export async function CreateWorkspaceAction({ request }: { request: Request }) {
    const formData = await request.formData();

    const data: unknown = {
        name: formData.get('name'),
    }

    try {
        const promise = workspaceApi.create(data);

        notify.promise(promise, {
            loading: "Creating workspace... ",
            success: feedbackMessage.workspace.createSuccess,
            error: feedbackMessage.workspace.createFailed
        })

        const workspace = await promise;

        return redirect(`/board/workspaces/${workspace.id}`);
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode),
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