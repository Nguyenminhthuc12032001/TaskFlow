import type { LoaderFunctionArgs } from "react-router-dom";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import { notify } from "../../../app/shared/lib/notify";
import type { ActionError } from "../../type";
import { leadApi } from "../lead.api";
import { z, ZodError } from "zod";
import { getQueryFromSearchParams } from "../../../app/shared/lib/query";

export async function ListLeadByUserWorkspacesLoader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const query = getQueryFromSearchParams(url.searchParams, [
        "page",
        "limit",
        "search",
        "startDate",
        "endDate",
        "stage",
        "workspaceId",
    ]);

    try {
        const promise = leadApi.listByUserWorkspaces(query);

        notify.promise(promise, {
            loading: "Loading leads... ",
            success: feedbackMessage.lead.listByWorkspaceSuccess,
            error: feedbackMessage.lead.listByWorkspaceFailed
        });

        return await promise;
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode),
                    errorMessage: error.message
                } satisfies ActionError
            }

            if (error.status === 403 || error.status === 404) {
                return {
                    errorMessage: error.message
                } satisfies ActionError
            }
        }

        if (error instanceof ZodError) {
            const { formErrors, fieldErrors } = z.flattenError(error);

            return { formErrors, fieldErrors } satisfies ActionError
        }

        throw error;
    }
}
