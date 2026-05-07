import type { LoaderFunctionArgs } from "react-router-dom";
import { columnApi } from "../column.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";
import { getQueryFromSearchParams } from "../../../app/shared/lib/query";

export async function ListByProjectLoader({ params, request }: LoaderFunctionArgs) {
    const workspaceId = params.workspaceId;
    const projectId = params.projectId;
    const url = new URL(request.url);
    const query = getQueryFromSearchParams(url.searchParams, [
        "page",
        "limit",
        "search",
        "startDate",
        "endDate",
        "type",
    ]);

    try {
        const promise = columnApi.listByProject(workspaceId, projectId, query);

        notify.promise(promise, {
            loading: "Loading columns... ",
            success: feedbackMessage.column.listByProjectSuccess,
            error: feedbackMessage.column.listByProjectFailed
        });

        return await promise;
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
            const { formErrors, fieldErrors } = z.flattenError(error);

            return {
                formErrors,
                fieldErrors
            } satisfies ActionError
        }

        throw error;
    }
}
