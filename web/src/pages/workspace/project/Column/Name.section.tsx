import { useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import { CheckIcon, EditIcon, XIcon } from "../../../../components/ui/Icons";
import type { ActionError } from "../../../../features/type";

type RenameColumnActionData = ActionError | undefined;

function isActionError(data: RenameColumnActionData): data is ActionError {
    return !!data && typeof data === "object" && (
        "fieldErrors" in data ||
        "formErrors" in data ||
        "errorMessage" in data
    );
}

export function ColumnNameSection({
    columnId,
    initialName,
    canRenameColumn,
    disabled = false,
    action,
    variant = "card",
}: {
    columnId: string;
    initialName: string;
    canRenameColumn: boolean;
    disabled?: boolean;
    action?: string;
    variant?: "card" | "hero";
}) {
    const fetcher = useFetcher<RenameColumnActionData>();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);

    const fetcherData = fetcher.data;

    const nameError = isActionError(fetcherData)
        ? fetcherData.fieldErrors?.name?.[0]
        : undefined;

    const formError = isActionError(fetcherData)
        ? fetcherData.formErrors?.[0]
        : undefined;

    const errorMessage = isActionError(fetcherData)
        ? fetcherData.errorMessage
        : undefined;

    const isSubmitting = fetcher.state === "submitting";
    const isReadOnly = !canRenameColumn || !isEditing || disabled;
    const inputClassName =
        variant === "hero"
            ? "w-full min-w-0 rounded-xl border px-3 py-2 text-3xl font-semibold tracking-tight outline-none transition"
            : "w-full min-w-0 rounded-lg border px-3 py-1.5 text-base font-semibold outline-none transition";
    const readOnlyClassName =
        variant === "hero"
            ? "border-transparent bg-transparent px-0 text-zinc-950"
            : "border-transparent bg-transparent px-0 py-0.5 text-slate-900";

    function handleCancel() {
        setName(initialName);
        setIsEditing(false);
    }

    useEffect(() => {
        setName(initialName);
    }, [initialName]);

    useEffect(() => {
        if (
            fetcher.state === "idle" &&
            fetcherData &&
            !isActionError(fetcherData)
        ) {
            setIsEditing(false);
        }
    }, [fetcher.state, fetcherData]);

    return (
        <div className="min-w-0">
            <fetcher.Form
                method="post"
                action={action ?? `${columnId}/rename`}
                className="space-y-2"
            >
                <input type="hidden" name="intent" value="rename-column" />
                <input type="hidden" name="columnId" value={columnId} />

                <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            readOnly={isReadOnly}
                            className={[
                                inputClassName,
                                isReadOnly
                                    ? readOnlyClassName
                                    : nameError
                                        ? "border-red-300 bg-white"
                                        : "border-slate-200 bg-white",
                            ].join(" ")}
                        />

                        {nameError && (
                            <p className="mt-1 text-xs text-red-600">{nameError}</p>
                        )}
                    </div>

                    {canRenameColumn && !isEditing && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            disabled={disabled}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Edit column name"
                            title="Edit column name"
                        >
                            <EditIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {canRenameColumn && isEditing && (
                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-60"
                            aria-label={isSubmitting ? "Saving column name" : "Save column name"}
                            title={isSubmitting ? "Saving..." : "Save"}
                        >
                            <CheckIcon className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                            aria-label="Cancel column name edit"
                            title="Cancel"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </fetcher.Form>

            {(formError || errorMessage) && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {formError || errorMessage}
                </div>
            )}
        </div>
    );
}
