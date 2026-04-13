import { redirect } from "react-router-dom";
import { authApi } from "../auth.api";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import z, { ZodError } from "zod";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { notify } from "../../../app/shared/lib/notify";

export async function RegisterAction({ request }: { request: Request }) {
    const formData = await request.formData();

    if (formData.get('password') !== formData.get('confirmPassword')) {
        return {
            fieldErrors: {
                confirmPassword: ["Passwords do not match"]
            }
        } satisfies ActionError;
    }

    const data: unknown = {
        email: formData.get('email'),
        name: formData.get('name'),
        password: formData.get('password'),
    }

    try {
        const registerPromise = authApi.register(data);

        notify.promise(registerPromise, {
            loading: "Registering...",
            success: feedbackMessage.auth.registerSuccess,
            error: feedbackMessage.auth.registerFailed,
        });

        await registerPromise;

        return redirect("/");
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode),
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
                formErrors,
            } satisfies ActionError;
        }

        throw error;
        // need to handle this error properly in the UI
    }
}