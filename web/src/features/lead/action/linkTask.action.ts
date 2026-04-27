import type { ActionFunctionArgs } from "react-router-dom";
import { leadApi } from "../lead.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function LinkTaskAction({ params }: ActionFunctionArgs) {
    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        leadId: params.leadId,
        taskId: params.taskId
    }; 

    try {
        const promise = leadApi.linkTask(paramsData);

        notify.promise(promise, {
            loading: "Linking task... ",
            success: feedbackMessage.lead.linkTaskSuccess,
            error: feedbackMessage.lead.linkTaskFailed
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
            const { fieldErrors, formErrors } = z.flattenError(error);

            return {
                fieldErrors,
                formErrors
            } satisfies ActionError
        }

        throw error;
    }
}