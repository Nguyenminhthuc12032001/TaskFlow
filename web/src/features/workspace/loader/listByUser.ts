import type { LoaderFunctionArgs } from "react-router-dom";
import { workspaceApi } from "../workspace.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { ZodError } from "zod";
import type { SafeWorkspacesResponse } from "../workspace.schema";

export async function ListByUserLoader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);

    const query = {
        page: url.searchParams.get('page') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined
    };

    try {
        const promise = workspaceApi.listByUser(query);

        notify.promise(promise, {
            loading: "Loading workspace... ",
            success: feedbackMessage.workspace.listByUserSuccess,
            error: feedbackMessage.workspace.listByUserFailed
        });

        const data = await promise; 

        return data satisfies SafeWorkspacesResponse;
        
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return { 
                    errorMessage: error.message
                } satisfies ActionError
            }

            if (error.status === 403) {
                return { 
                    errorMessage: error.message
                } satisfies ActionError
            }
        }

        if (error instanceof ZodError) { 
            return { 
                errorMessage: error.message
            } satisfies ActionError
        }

        throw error;
         // need to handle this error properly in the UI
    }
}