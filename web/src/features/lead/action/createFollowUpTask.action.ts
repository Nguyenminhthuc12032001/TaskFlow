import type { ActionFunctionArgs } from "react-router-dom";
import { leadApi } from "../lead.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import { HttpError, normalizeZodError, type ZodTreeErrorNode } from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { z, ZodError } from "zod";

export async function CreateFollowUpTaskAction({ params, request }: ActionFunctionArgs) {
    const formData = await request.formData();
    
    const paramsData: unknown = {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        columnId: params.columnId,
        leadId: params.leadId
    };

    const description = formData.get('description')?.toString().trim();
    const dueDate = formData.get('dueDate')?.toString();
    const priority = formData.get('priority')?.toString();

    const data: unknown = {
        title: formData.get('title'),
        ...(description && { description }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate })
    };

    try {
        const promise = leadApi.createFollowUpTask(paramsData, data);

        notify.promise(promise, {
            loading: "Creating task... ",
            success: feedbackMessage.task.createSuccess,
            error: feedbackMessage.task.createFailed
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
                fieldErrors,
                formErrors
            } satisfies ActionError
        }

        throw error;
    }
}
