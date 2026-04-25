import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigate,
} from "react-router-dom";
import type { GetColumnByIdLoader } from "../../../../features/column/loader/getById.loader";

export function DetailColumnPage() {
  const data = useLoaderData<typeof GetColumnByIdLoader>();
  const navigate = useNavigate();

  if (!data) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-4xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-zinc-500">
            No column data found.
          </p>
        </div>
      </section>
    );
  }

  if ("errorMessage" in data) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-4xl border border-red-100 bg-red-50/80 p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-600">
            Failed to load column
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            {data.errorMessage}
          </h1>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Go back
          </button>
        </div>
      </section>
    );
  }

  if ("formErrors" in data) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-4xl border border-amber-100 bg-amber-50/80 p-10 shadow-sm">
          <p className="text-sm font-semibold text-amber-700">
            Something went wrong
          </p>

          <ul className="mt-4 space-y-2 text-sm text-amber-800">
            {data.formErrors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Go back
          </button>
        </div>
      </section>
    );
  }

  const createdAt = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const typeLabel = {
    todo: "To do",
    in_process: "In process",
    done: "Done",
    custom: "Custom",
  }[data.type];

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
        >
          ← Back
        </button>

        <Link
          to="edit"
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
        >
          Edit column
        </Link>
      </div>

      <div className="overflow-hidden rounded-4xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-linear-to-br from-zinc-50 via-white to-zinc-100/60 px-8 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active column
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-950">
                {data.name}
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                A focused workspace lane for managing tasks, reviewing flow,
                and keeping project execution clean.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm">
                {typeLabel}
              </span>

              <span className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm">
                Position #{data.position}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-0 divide-y divide-zinc-100 border-b border-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Created at
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-950">
              {createdAt}
            </p>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Column ID
            </p>
            <p className="mt-2 truncate text-sm font-medium text-zinc-600">
              {data.id}
            </p>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Project ID
            </p>
            <p className="mt-2 truncate text-sm font-medium text-zinc-600">
              {data.projectId}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                Column activity
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Open tasks for this column without leaving the detail page.
              </p>
            </div>

            <div className="flex rounded-full border border-zinc-200 bg-zinc-50 p-1">
              <NavLink
                to="tasks"
                className={({ isActive }) =>
                  [
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-950",
                  ].join(" ")
                }
              >
                View tasks
              </NavLink>
            </div>
          </div>

          <div className="min-h-56 rounded-4xl border border-zinc-200 bg-zinc-50/60 p-4">
            <Outlet context={{ column: data }} />
          </div>
        </div>
      </div>
    </section>
  );
}