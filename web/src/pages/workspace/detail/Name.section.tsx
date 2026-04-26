import { useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import { CheckIcon, EditIcon, XIcon } from "../../../components/ui/Icons";
import type { ActionError } from "../../../features/type";

type RenameWorkspaceActionData = ActionError | undefined;

function isActionError(data: RenameWorkspaceActionData): data is ActionError {
  return !!data && typeof data === "object" && (
    "fieldErrors" in data ||
    "formErrors" in data ||
    "errorMessage" in data
  );
}

export function WorkspaceNameSection({
  workspaceId,
  initialName,
  canRenameWorkspace,
}: {
  workspaceId: string;
  initialName: string;
  canRenameWorkspace: boolean;
}) {
  const fetcher = useFetcher<RenameWorkspaceActionData>();
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
  const isReadOnly = !canRenameWorkspace || !isEditing;

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
    <div className="space-y-3">
      <fetcher.Form method="post" className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="intent" value="rename-workspace" />
        <input type="hidden" name="workspaceId" value={workspaceId} />

        <div className="min-w-0 flex-1">
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={isReadOnly}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "workspace-name-error" : undefined}
            className={[
              "w-full min-w-0 rounded-xl border px-3 py-2 text-3xl font-semibold tracking-tight outline-none transition sm:text-4xl",
              isReadOnly
                ? "border-transparent bg-transparent text-slate-900"
                : nameError
                ? "border-red-300 bg-white text-slate-900 shadow-sm focus:border-red-400"
                : "border-slate-200 bg-white text-slate-900 shadow-sm focus:border-slate-300",
            ].join(" ")}
          />

          {nameError && (
            <p
              id="workspace-name-error"
              className="mt-2 text-sm text-red-600"
            >
              {nameError}
            </p>
          )}
        </div>

        {canRenameWorkspace && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Edit workspace name"
            title="Edit workspace name"
          >
            <EditIcon className="h-5 w-5" />
          </button>
        )}

        {canRenameWorkspace && isEditing && (
          <>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-60"
              aria-label={isSubmitting ? "Saving workspace name" : "Save workspace name"}
              title={isSubmitting ? "Saving..." : "Save"}
            >
              <CheckIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              aria-label="Cancel workspace name edit"
              title="Cancel"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </fetcher.Form>

      {(formError || errorMessage) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError || errorMessage}
        </div>
      )}
    </div>
  );
}
