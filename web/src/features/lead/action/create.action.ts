import { leadApi } from "../lead.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";
import { redirect, type ActionFunctionArgs } from "react-router-dom";

export async function CreateLeadAction({ params, request }: ActionFunctionArgs) {
    const paramsData: unknown = {
        workspaceId: params.workspaceId
    };

    const formData = await request.formData();

    const data: unknown = {
        name: formData.get('name'),
        note: formData.get('note'),
        ...(formData.get('email') && { email: formData.get('email') }),
        ...(formData.get('phone') && { phone: formData.get('phone') }),
        ...(formData.get('source') && { source: formData.get('source') }),
        ...(formData.get('stage') && { stage: formData.get('stage') }),
    };

    try {
        const promise = leadApi.create(paramsData, data);

        notify.promise(promise, {
            loading: "Creating lead... ",
            success: feedbackMessage.lead.createSuccess,
            error: feedbackMessage.lead.createFailed
        });

        await promise;

        return redirect(`/board/workspaces/${params.workspaceId}/leads`);
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode),
                    errorMessage: error.message
                } satisfies ActionError
            }

            if (error.status === 401 || error.status === 403 || error.status === 404 || error.status === 409) {
                return {
                    errorMessage: error.message
                } as ActionError
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
