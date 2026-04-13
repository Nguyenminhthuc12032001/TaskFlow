import { redirect } from "react-router-dom";
import { authApi } from "../../../features/auth/auth.api"; 
import z, { ZodError } from "zod";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";

export async function ResetPasswordAction({ request } : { request: Request }) {
    const formData = await request.formData();

    const data: unknown = {
        resetToken: formData.get('resetToken'),
        newPassword: formData.get('newPassword'),
    }

    try {
        const resetPasswordPromise = authApi.resetPassword(data);

        notify.promise(resetPasswordPromise, {
            loading: "Resetting password... ",
            success: feedbackMessage.auth.resetPasswordSuccess,
            error: feedbackMessage.auth.resetPasswordFailed
        })

        await resetPasswordPromise;

        return redirect("/");
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode),
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

        throw error
        // need to handle other errors
    }
}