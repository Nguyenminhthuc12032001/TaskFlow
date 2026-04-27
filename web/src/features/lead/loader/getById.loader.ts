import type { LoaderFunctionArgs } from "react-router-dom";
import { leadApi } from "../lead.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function GetByIdLoader({ params }: LoaderFunctionArgs) {
    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        leadId: params.leadId
    }

    try {
        const promise = leadApi.getById(paramsData);

        notify.promise(promise, {
            loading: "Loading lead... ",
            success: feedbackMessage.lead.getByIdSuccess,
            error: feedbackMessage.lead.getByIdFailed
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