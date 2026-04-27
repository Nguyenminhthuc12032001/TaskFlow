import type { ActionFunctionArgs } from "react-router-dom";
import { leadApi } from "../lead.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function UpdateStageAction({ params, request }: ActionFunctionArgs) {
    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        leadId: params.leadId
    };

    const formData = await request.formData();

    const data: unknown = {
        stage: formData.get('stage')
    };

    try {
        const promise = leadApi.updateLeadStage(paramsData, data);

        notify.promise(promise, {
            loading: "Updating lead stage... ",
            success: feedbackMessage.lead.updateStageSuccess,
            error: feedbackMessage.lead.updateStageFailed
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

            if (error.status === 403 || error.status === 404 || error.status === 409) {
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