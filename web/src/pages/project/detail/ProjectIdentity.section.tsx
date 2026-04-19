import { useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import type { ActionError } from "../../../features/type";

type UpdateProjectActionData =
  | ActionError
  | undefined;

function isActionError(data: UpdateProjectActionData): data is ActionError {
  return !!data && typeof data === "object" && (
    "fieldErrors" in data ||
    "formErrors" in data ||
    "errorMessage" in data
  );
}

export function ProjectIdentitySection({
  initialName,
  initialDescription,
  canEditProject,
}: {
  initialName: string;
  initialDescription?: string | null;
  canEditProject: boolean;
}) {
  const fetcher = useFetcher<UpdateProjectActionData>();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");

  const fetcherData = fetcher.data;
  const isSubmitting = fetcher.state === "submitting";

  const nameError = isActionError(fetcherData)
    ? fetcherData.fieldErrors?.name?.[0]
    : undefined;

  const descriptionError = isActionError(fetcherData)
    ? fetcherData.fieldErrors?.description?.[0]
    : undefined;

  const formError = isActionError(fetcherData)
    ? fetcherData.formErrors?.[0]
    : undefined;

  const errorMessage = isActionError(fetcherData)
    ? fetcherData.errorMessage
    : undefined;

  const isReadOnly = !canEditProject || !isEditing;

  function handleCancel() {
    setName(initialName);
    setDescription(initialDescription ?? "");
    setIsEditing(false);
  }

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    setDescription(initialDescription ?? "");
  }, [initialDescription]);

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
    <div className="space-y-4">
      <fetcher.Form method="post" className="space-y-4">

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={isReadOnly}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "project-name-error" : undefined}
              className={[
                "w-full min-w-0 rounded-2xl border px-4 py-2 text-3xl font-semibold tracking-tight outline-none transition sm:text-4xl",
                isReadOnly
                  ? "border-transparent bg-transparent text-slate-900"
                  : nameError
                    ? "border-red-300 bg-white text-slate-900 shadow-sm focus:border-red-400"
                    : "border-slate-200 bg-white text-slate-900 shadow-sm focus:border-slate-300",
              ].join(" ")}
            />

            {nameError && (
              <p id="project-name-error" className="mt-2 text-sm text-red-600">
                {nameError}
              </p>
            )}
          </div>

          {canEditProject && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Edit project"
              title="Edit project"
            >
              ✏️
            </button>
          )}
        </div>

        <div>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            readOnly={isReadOnly}
            rows={isReadOnly ? 1 : 2}
            aria-invalid={!!descriptionError}
            aria-describedby={
              descriptionError ? "project-description-error" : undefined
            }
            className={[
              "w-full rounded-2xl border px-4 py-2.5 text-[15px] leading-6 outline-none transition resize-none",
              isReadOnly
                ? "border-transparent bg-transparent text-slate-600 shadow-none"
                : descriptionError
                  ? "border-red-300 bg-white text-slate-900 shadow-sm focus:border-red-400"
                  : "border-slate-200 bg-white text-slate-900 shadow-sm focus:border-slate-300",
            ].join(" ")}
            placeholder="Add a short and clear description for this project..."
          />

          {descriptionError && (
            <p
              id="project-description-error"
              className="mt-2 text-sm text-red-600"
            >
              {descriptionError}
            </p>
          )}
        </div>

        {canEditProject && isEditing && (
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        )}
      </fetcher.Form>

      {(formError || errorMessage) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError || errorMessage}
        </div>
      )}
    </div>
  );
}