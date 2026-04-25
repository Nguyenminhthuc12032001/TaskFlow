import { Form, Link, useActionData, useNavigation } from "react-router-dom";
import type { CreateTaskAction } from "../../../../../features/task/action/create.action";

type TaskFieldName = "title" | "description" | "dueDate" | "priority";

function getFieldError(
  errorAction: Awaited<ReturnType<typeof CreateTaskAction>> | undefined,
  fieldName: TaskFieldName
) {
  if (!errorAction) return undefined;
  if (!("fieldErrors" in errorAction)) return undefined;
  if (!errorAction.fieldErrors) return undefined;

  const fieldErrors = errorAction.fieldErrors as Partial<
    Record<TaskFieldName, string[]>
  >;

  return fieldErrors[fieldName]?.[0];
}

export function CreateTaskPage() {
  const errorAction = useActionData<typeof CreateTaskAction>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const titleError = getFieldError(errorAction, "title");
  const descriptionError = getFieldError(errorAction, "description");
  const dueDateError = getFieldError(errorAction, "dueDate");
  const priorityError = getFieldError(errorAction, "priority");

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">
            Create new task
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Add a new task to this column.
          </p>
        </div>

        <Link
          to=".."
          relative="path"
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
        >
          Cancel
        </Link>
      </div>

      {errorAction?.errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {errorAction.errorMessage}
          </p>
        </div>
      )}

      <Form method="post" className="space-y-4">
        <div>
          <label htmlFor="title" className="text-sm font-medium text-zinc-700">
            Title
          </label>

          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter task title"
            className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
          />

          {titleError && (
            <p className="mt-2 text-sm text-red-600">{titleError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="text-sm font-medium text-zinc-700"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Write a short description"
            className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
          />

          {descriptionError && (
            <p className="mt-2 text-sm text-red-600">{descriptionError}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="dueDate"
              className="text-sm font-medium text-zinc-700"
            >
              Due date
            </label>

            <input
              type="date"
              id="dueDate"
              name="dueDate"
              className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
            />

            {dueDateError && (
              <p className="mt-2 text-sm text-red-600">{dueDateError}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="priority"
              className="text-sm font-medium text-zinc-700"
            >
              Priority
            </label>

            <select
              id="priority"
              name="priority"
              defaultValue="medium"
              className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            {priorityError && (
              <p className="mt-2 text-sm text-red-600">{priorityError}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to=".."
            relative="path"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create task"}
          </button>
        </div>
      </Form>
    </section>
  );
}