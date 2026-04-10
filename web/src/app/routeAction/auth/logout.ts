import { redirect } from "react-router-dom";
import { authApi } from "../../../features/auth/auth.api";
import { feedbackMessage } from "../../shared/constants/feedback-messages";
import { notify } from "../../shared/lib/notify";
import { HttpError } from "../../shared/lib/http-error";

export async function LogoutAction() {
    try {
        const logoutPromise = authApi.logout();

        notify.promise(logoutPromise, {
            loading: "Signing out...",
            success: feedbackMessage.auth.logoutSuccess,
            error: feedbackMessage.auth.logoutFailed,
        })

        await logoutPromise;

        return redirect("/");
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 401) {
                notify.error(feedbackMessage.auth.logoutFailed);

                return;
            }
        }

        throw error
    }
}