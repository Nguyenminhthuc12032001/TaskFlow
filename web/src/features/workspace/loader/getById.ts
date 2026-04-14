import type { LoaderFunctionArgs } from "react-router-dom"; 
import { workspaceApi } from "../workspace.api";
import { notify } from "../../../app/shared/lib/notify";
import { feedbackMessage } from "../../../app/shared/constants/feedback-messages";
import {
    HttpError,
    normalizeZodError,
    type ZodTreeErrorNode,
} from "../../../app/shared/lib/http-error";
import type { ActionError } from "../../type";
import { ZodError } from "zod";
import z from "zod";
import type { SafeWorkspaceResponse } from "../workspace.schema";

export async function GetByIdLoader({ params }: LoaderFunctionArgs) { 
    const workspaceId = params.workspaceId;

    try {
        const promise = workspaceApi.getById(workspaceId);

        notify.promise(promise, {
            loading: "Loading workspace...",
            success: feedbackMessage.workspace.getByIdSuccess,
            error: feedbackMessage.workspace.getByIdFailed,
        });
        const data = await promise;

        return data as SafeWorkspaceResponse;
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                return {
                    fieldErrors: normalizeZodError(error.details as ZodTreeErrorNode),
                    errorMessage: error.message,
                } satisfies ActionError;
            }

            if (error.status === 404) {
                return {
                    errorMessage: error.message,
                } satisfies ActionError;
            }
        }

        if (error instanceof ZodError) {
            const { fieldErrors, formErrors } = z.flattenError(error);

            return {
                fieldErrors,
                formErrors,
            } satisfies ActionError;
        }

        throw error;
    }
}