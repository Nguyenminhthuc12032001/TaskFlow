import { redirect, type ActionFunctionArgs } from "react-router-dom";
import { workspaceApi } from "../workspace.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import z, { ZodError } from "zod";

export async function InviteAction({ request, params }: ActionFunctionArgs) {
    const form = await request.formData();

    const workspaceId = params.workspaceId

    const data: unknown = {
        email: form.get('email'),
        role: form.get('role'),
    }

    try {
        const promise = workspaceApi.invite(workspaceId, data);

        notify.promise(promise, {
            loading: "Inviting user... ",
            success: feedbackMessage.workspace.inviteSuccess,
            error: feedbackMessage.workspace.inviteFailed
        })

        await promise;

        return redirect(`/board/workspaces/${workspaceId}`);
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