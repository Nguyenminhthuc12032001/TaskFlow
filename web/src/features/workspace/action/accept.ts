import { redirect, type ActionFunctionArgs } from "react-router-dom";
import { workspaceApi } from "../workspace.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import z, { ZodError } from "zod";

export async function AcceptInviteAction({ request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const data: unknown = {
        token: formData.get('token'),
    }

    try {
        const promist = workspaceApi.accept(data);

        notify.promise(promist, {
            loading: "Accepting invite... ",
            success: feedbackMessage.workspace.acceptInviteSuccess,
            error: feedbackMessage.workspace.acceptInviteFailed
        })

        const workspaceMember = await promist;

        return redirect(`/board/workspaces/${workspaceMember.workspaceId}`);
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
                    errorMessage: error.message,
                } satisfies ActionError;
            }

            if (error.status === 404) {
                return {
                    errorMessage: error.message,
                } satisfies ActionError;
            }

            if (error.status === 409) {
                return {
                    errorMessage: error.message,
                } satisfies ActionError;
            }
        }

        if (error instanceof ZodError) {
            const { fieldErrors, formErrors } = z.flattenError(error);  
            return {
                fieldErrors,
                formErrors
            } satisfies ActionError;
        }

        throw error;
        // Need to handle other errors
    }
}