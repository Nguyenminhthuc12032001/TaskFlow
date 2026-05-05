import type { ActionFunctionArgs } from "react-router-dom";
import { leadApi } from "../lead.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError } from "../../../app/shared/lib/http-error";
import { normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function UpdateLeadAction({ params, request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        leadId: params.leadId
    };

    const data: unknown = {
        ...(formData.get('name') && { name: formData.get('name') }),
        ...(formData.get('email') && { email: formData.get('email') }),
        ...(formData.get('phone') && { phone: formData.get('phone') }),
        ...(formData.get('source') && { source: formData.get('source') }),
        ...(formData.get('note') && { note: formData.get('note') }),
    };

    try {
        const promise = leadApi.update(paramsData, data);

        notify.promise(promise, {
            loading: "Updating lead... ",
            success: feedbackMessage.lead.updateSuccess,
            error: feedbackMessage.lead.updateFailed
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

            return {
                formErrors,
                fieldErrors
            } satisfies ActionError
        }

        throw error;
    }
}
