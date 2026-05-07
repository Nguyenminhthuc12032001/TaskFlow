import type { LoaderFunctionArgs } from "react-router-dom";
import { taskApi } from "../task.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";
import { getQueryFromSearchParams } from "../../../app/shared/lib/query";

export async function ListByColumnLoader({params, request}: LoaderFunctionArgs) {
    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        columnId: params.columnId
    };
    const url = new URL(request.url);
    const rawQuery = getQueryFromSearchParams(url.searchParams, [
        "page",
        "limit",
        "search",
        "startDate",
        "endDate",
        "priority",
        "dueStartDate",
        "dueEndDate",
    ]);
    const { dueStartDate, dueEndDate, ...query } = rawQuery;
    const taskQuery = {
        ...query,
        ...(dueStartDate || dueEndDate
            ? {
                dueDateRange: {
                    startDate: dueStartDate,
                    endDate: dueEndDate,
                },
            }
            : {}),
    };

    try {
        const promise = taskApi.listByColumn(paramsData, taskQuery);

        notify.promise(promise, {
            loading: "Loading tasks... ",
            success: feedbackMessage.task.listByColumnSuccess,
            error: feedbackMessage.task.listByColumnFailed
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
            } satisfies ActionError;
        }

        throw error;
    }
}
