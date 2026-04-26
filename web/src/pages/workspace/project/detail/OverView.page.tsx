import { Link, useRouteLoaderData } from "react-router-dom";
import type { ProjectByIdLoader } from "../../../../features/project/loader/getById.loader";

export function ProjectOverviewPage() {
  const project = useRouteLoaderData<typeof ProjectByIdLoader>("project-detail");

  if (
    !project ||
    "errorMessage" in project ||
    "formErrors" in project ||
    "fieldErrors" in project
  ) {
    return null;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-slate-500">About this project</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          Project summary
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {project.description}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-slate-500">Quick actions</p>

        <div className="mt-5 space-y-3">
          <Link
            to="columns"
            relative="path"
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white"
          >
            <span>Open columns board</span>
            <span aria-hidden="true">-&gt;</span>
          </Link>

          <Link
            to={`/board/workspaces/${project.workspaceId}/members`}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white"
          >
            <span>View workspace members</span>
            <span aria-hidden="true">-&gt;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
