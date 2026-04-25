import { useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
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
}: {
    columnId: string;
    initialName: string;
    canRenameColumn: boolean;
    disabled?: boolean;
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
                action={`${columnId}/rename`}
                className="space-y-2">
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
                                "w-full min-w-0 rounded-xl border px-3 py-2 text-lg font-semibold outline-none transition",
                                isReadOnly
                                    ? "border-transparent bg-transparent px-0 text-zinc-900"
                                    : nameError
                                        ? "border-red-300 bg-white"
                                        : "border-zinc-200 bg-white"
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
                            className="rounded-xl border border-zinc-200 px-2 py-1 text-sm"
                        >
                            ✏️
                        </button>
                    )}
                </div>

                {canRenameColumn && isEditing && (
                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm text-white"
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </fetcher.Form>

            {(formError || errorMessage) && (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {formError || errorMessage}
                </div>
            )}
        </div>
    );
}