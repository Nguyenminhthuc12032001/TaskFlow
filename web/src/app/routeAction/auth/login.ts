import { redirect } from "react-router-dom";
import { authApi } from "../../../features/auth/auth.api";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../shared/lib/http-error";
import z, { ZodError } from "zod";
import type { ActionError } from "../type";
import { notify } from "../../shared/lib/notify";
import { feedbackMessage } from "../../shared/constants/feedback-messages";

export async function LoginAction({ request }: { request: Request }) {
    const formData = await request.formData();

    const data: unknown = {
        email: formData.get('email'),
        password: formData.get('password'),
    };

    try {
        const loginPromise = authApi.login(data);

        notify.promise(loginPromise, {
            loading: "Signing in...",
            success: feedbackMessage.auth.loginSuccess,
            error: feedbackMessage.auth.loginFailed,
        });

        await loginPromise;

        return redirect("/");
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 401) {
                return {
                    errorMessage: error.message
                }
            }

            if (error.status === 400) {
                return {
                    errorMessage: error.message,
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode)
                } satisfies ActionError
            }
        }

        if (error instanceof ZodError) {
            const { fieldErrors, formErrors } = z.flattenError(error);
            return {
                fieldErrors,
                formErrors,
            } satisfies ActionError
        }

        throw error;
        // need to handle this error properly in the UI
    }
}