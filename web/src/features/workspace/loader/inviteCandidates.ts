import type { LoaderFunctionArgs } from "react-router-dom";
import { workspaceApi } from "../workspace.api";
import { HttpError } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { ZodError } from "zod";
import type { InviteCandidatesResponse } from "../../../../../api/src/modules/workspace/workspace.schemas";

export async function InviteCandidatesLoader({ params }: LoaderFunctionArgs) {
    const workspaceId = params.workspaceId;

    try {
        const data = await workspaceApi.listInviteCandidates(workspaceId);

        return data satisfies InviteCandidatesResponse;
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400 || error.status === 403 || error.status === 404) {
                return {
                    errorMessage: error.message,
                } satisfies ActionError;
            }
        }

        if (error instanceof ZodError) {
            return {
                errorMessage: error.message,
            } satisfies ActionError;
        }

        throw error;
    }
}
