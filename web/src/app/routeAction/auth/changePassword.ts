import z, { ZodError } from "zod";
import { authApi } from "../../../features/auth/auth.api";
import { feedbackMessage } from "../../shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../shared/lib/http-error";
import { notify } from "../../shared/lib/notify";
import type { ActionError } from "../type";
import { redirect } from "react-router-dom";

export async function ChangePasswordAction({ request }: { request: Request }) {
    const formData = await request.formData();

    if (formData.get('newPassword') !== formData.get('confirmPassword')) {
        return {
            fieldErrors: {
                confirmPassword: ["Passwords do not match"]
            }
        } satisfies ActionError
    }

    const data: unknown = {
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
    }

    try {
        const changePasswordPromise = authApi.changePassword(data);

        notify.promise(changePasswordPromise, {
            loading: "Changing password...",
            success: feedbackMessage.auth.changePasswordSuccess,
            error: feedbackMessage.auth.changePasswordFailed,
        })

        await changePasswordPromise;

        return redirect("/");
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 401) {
                return {
                    errorMessage: error.message
                } satisfies ActionError
            }

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