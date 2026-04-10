import { redirect } from "react-router-dom";
import { feedbackMessage } from "../../shared/constants/feedback-messages";
import { notify } from "../../shared/lib/notify";
import { authApi } from "../../../features/auth/auth.api";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../shared/lib/http-error";
import type { ActionError } from "../type";
import z, { ZodError } from "zod";

export async function ForgotPasswordAction({ request } : { request: Request }) {
    const formData = await request.formData();

    const data: unknown = {
        email: formData.get('email'),
    }

    try {
        const forgotPasswordPromise = authApi.forgotPassword(data);

        notify.promise(forgotPasswordPromise, {
            loading: "Sending email... ",
            success: feedbackMessage.auth.forgotPasswordSuccess,
            error: feedbackMessage.auth.forgotPasswordFailed
        })

        await forgotPasswordPromise;

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
    }
}