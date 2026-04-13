import { redirect } from "react-router-dom";
import { authApi } from "../auth.api";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { notify } from "../../../app/shared/lib/notify";  

export async function LogoutAction() {
    
        const logoutPromise = authApi.logout();

        notify.promise(logoutPromise, {
            loading: "Signing out...",
            success: feedbackMessage.auth.logoutSuccess,
            error: feedbackMessage.auth.logoutFailed,
        })

        await logoutPromise;

        return redirect("/"); 
}