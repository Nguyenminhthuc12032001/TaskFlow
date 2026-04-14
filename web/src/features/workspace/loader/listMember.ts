import type { LoaderFunctionArgs } from "react-router-dom";
import { workspaceApi } from "../workspace.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import type { SafeMembersResponse } from "../workspace.schema";
import { HttpError } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { ZodError } from "zod"; 

export async function ListMemberLoader({ params, request }: LoaderFunctionArgs) { 
    const workspaceId = params.workspaceId

    const url = new URL(request.url);

    const query = {
        page: url.searchParams.get('page') ?? undefined,
        limit: url.searchParams.get('limit') ?? undefined
    };

    try {
        const promise = workspaceApi.listMember(workspaceId, query);

        notify.promise(promise, {
            loading: "Loading workspace members... ",
            success: feedbackMessage.workspace.listMemberSuccess,
            error: feedbackMessage.workspace.listMemberFailed
        })

        const data = await promise;

        return data satisfies SafeMembersResponse
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
            return {
                errorMessage: error.message
            } satisfies ActionError
        }

        throw error
        // need to handle other errors
    } 
}