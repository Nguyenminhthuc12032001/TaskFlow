import type { LoaderFunctionArgs } from "react-router-dom";
import { projectApi } from "../project.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import z, { ZodError } from "zod"; 
import { getQueryFromSearchParams } from "../../../app/shared/lib/query";

export async function ProjectsByWorkspaceLoader({ params, request }: LoaderFunctionArgs ) {
    const workspaceId = params.workspaceId;

    const url = new URL(request.url);
    const query = getQueryFromSearchParams(url.searchParams, [
        "page",
        "limit",
        "search",
        "startDate",
        "endDate",
    ]);
    
    try {
        const promise = projectApi.listByWorkspace(workspaceId, query);
        notify.promise(promise, {
            loading: "Loading projects... ",
            success: feedbackMessage.project.listByWorkspaceSuccess,
            error: feedbackMessage.project.listByWorkspaceFailed
        });
        
        const projects = await promise;

        return projects;
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

            if (error.status === 404) {
                return {
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

        throw error;
    }
    
}
