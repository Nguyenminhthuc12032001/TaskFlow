import {
  NavLink,
  Outlet,
  useLoaderData,
  useNavigate,
  useParams,
  useRouteLoaderData,
} from "react-router-dom";
import { EyeIcon } from "../../../../components/ui/Icons";
import type { GetColumnByIdLoader } from "../../../../features/column/loader/getById.loader";
import type { GetByIdLoader } from "../../../../features/workspace/loader/getById";
import { ColumnNameSection } from "./Name.section";

export function DetailColumnPage() {
  const data = useLoaderData<typeof GetColumnByIdLoader>();
  const workspaceData =
    useRouteLoaderData<typeof GetByIdLoader>("workspace-detail");
  const { workspaceId, projectId } = useParams();
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
  const role =
    workspaceData &&
    !("errorMessage" in workspaceData) &&
    !("formErrors" in workspaceData) &&
    !("fieldErrors" in workspaceData)
      ? workspaceData.myMembership.role
      : undefined;
  const canEditColumn = role === "owner" || role === "admin";
  const renameAction =
    workspaceId && projectId
      ? `/board/workspaces/${workspaceId}/projects/${projectId}/columns/${data.id}/rename`
      : "rename";

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </div>

              <div className="mt-4">
                <ColumnNameSection
                  columnId={data.id}
                  initialName={data.name}
                  canRenameColumn={canEditColumn}
                  action={renameAction}
                  variant="hero"
                />
              </div>

              <p className="mt-2 text-sm text-zinc-500">Column details and tasks.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700">
                {typeLabel}
              </span>

              <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700">
                #{data.position}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-0 divide-y divide-zinc-100 border-b border-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Created at
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-950">
              {createdAt}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Column ID
            </p>
            <p className="mt-2 truncate text-sm font-medium text-zinc-600">
              {data.id}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Project ID
            </p>
            <p className="mt-2 truncate text-sm font-medium text-zinc-600">
              {data.projectId}
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                Tasks
              </h2>
            </div>

            <div className="flex">
              <NavLink
                to="tasks"
                className={({ isActive }) =>
                  [
                    "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
                    isActive
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
                  ].join(" ")
                }
              >
                <EyeIcon className="h-4 w-4" />
                Tasks
              </NavLink>
            </div>
          </div>

          <div className="min-h-56">
            <Outlet context={{ column: data }} />
          </div>
        </div>
      </div>
    </div>
  );
}
