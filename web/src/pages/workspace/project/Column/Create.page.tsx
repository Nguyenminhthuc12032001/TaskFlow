import { Form, Link, useActionData, useNavigation } from "react-router-dom";
import type { CreateColumnAction } from "../../../../features/column/action/create.action";
import type { ActionError } from "../../../../features/type";

const columnTypeOptions = [
  {
    value: "todo",
    label: "To do",
    description: "Tasks that have not been started yet.",
  },
  {
    value: "in_process",
    label: "In progress",
    description: "Tasks that are currently being worked on.",
  },
  {
    value: "done",
    label: "Done",
    description: "Tasks that are already completed.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "A flexible column for your own workflow.",
  },
] as const;

export function CreateColumnPage() {
  const actionError: ActionError | undefined =
    useActionData<typeof CreateColumnAction>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const nameError = actionError?.fieldErrors?.name?.[0];
  const typeError = actionError?.fieldErrors?.type?.[0];
  const formError = actionError?.formErrors?.[0];
  const errorMessage = actionError?.errorMessage;

  const generalError = formError || errorMessage;

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-0">
      <div className="overflow-hidden rounded-4xl border border-slate-200/70 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
          <p className="text-sm font-medium text-slate-500">Project board</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Create column
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Add a new column to organize tasks in a clean and focused way.
          </p>
        </div>

        <Form method="post" className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="space-y-6">
            {generalError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {generalError}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-slate-700"
              >
                Column name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                autoComplete="off"
                disabled={isSubmitting}
                placeholder="e.g. Backlog, In Review, Blocked"
                aria-invalid={!!nameError}
                aria-describedby={
                  nameError ? "column-name-error" : "column-name-help"
                }
                className={[
                  "w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition",
                  "placeholder:text-slate-400",
                  isSubmitting ? "cursor-not-allowed bg-slate-50" : "bg-white",
                  nameError
                    ? "border-red-300 focus:border-red-400"
                    : "border-slate-200 focus:border-slate-300",
                ].join(" ")}
              />

              {nameError ? (
                <p id="column-name-error" className="text-sm text-red-600">
                  {nameError}
                </p>
              ) : (
                <p
                  id="column-name-help"
                  className="text-sm leading-6 text-slate-500"
                >
                  Keep it short and easy to scan. Good column names help the
                  board feel clearer.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Column type
                </label>
                <p className="text-sm leading-6 text-slate-500">
                  Choose the role of this column in your workflow.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {columnTypeOptions.map((option, index) => (
                  <label key={option.value} className="block">
                    <input
                      type="radio"
                      name="type"
                      value={option.value}
                      defaultChecked={index === 0}
                      disabled={isSubmitting}
                      className="peer sr-only"
                      aria-invalid={!!typeError}
                      aria-describedby={
                        typeError ? "column-type-error" : "column-type-help"
                      }
                    />

                    <span
                      className={[
                        "flex min-h-24 rounded-2xl border px-4 py-3 transition",
                        "border-slate-200 bg-white",
                        "peer-checked:border-slate-900 peer-checked:bg-slate-50",
                        "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
                        typeError ? "border-red-300" : "",
                      ].join(" ")}
                    >
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                          {option.label}
                        </span>
                        <span className="mt-1 text-sm leading-6 text-slate-500">
                          {option.description}
                        </span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              {typeError ? (
                <p id="column-type-error" className="text-sm text-red-600">
                  {typeError}
                </p>
              ) : (
                <p id="column-type-help" className="text-sm text-slate-500">
                  “To do” is a good default for most boards.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-4">
              <p className="text-sm font-medium text-slate-700">Naming tip</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Prefer simple names like{" "}
                <span className="font-medium text-slate-700">To do</span>,{" "}
                <span className="font-medium text-slate-700">In progress</span>,{" "}
                <span className="font-medium text-slate-700">Review</span>, or{" "}
                <span className="font-medium text-slate-700">Done</span>.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
              <Link
                to=".."
                relative="path"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating column..." : "Create column"}
              </button>
            </div>
          </div>
        </Form>
      </div>
    </section>
  );
}