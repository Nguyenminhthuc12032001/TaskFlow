import type { LoaderFunctionArgs } from "react-router-dom";
import { columnApi } from "../column.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import z, { ZodError } from "zod";

export async function GetColumnByIdLoader({ params }: LoaderFunctionArgs) {
    const workspaceId = params.workspaceId;
    const projectId = params.projectId;
    const columnId = params.columnId;

    try {
        const promise = columnApi.getById(workspaceId, projectId, columnId); 

        notify.promise(promise, {
            loading: "Loading column... ",
            success: feedbackMessage.column.getByIdSuccess,
            error: feedbackMessage.column.getByIdFailed
        });

        const column = await promise;

        return column;
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
                fieldErrors,
                formErrors
            } satisfies ActionError
        }
    }
}