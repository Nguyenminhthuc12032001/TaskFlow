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
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
        <p className="text-sm font-medium text-slate-500">About this project</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Clean and focused information
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          This section gives a calm and premium presentation style. The goal is
          not to overload the screen, but to make the project name, description,
          and metadata feel clear and well structured.
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          For a real production page, this block can later hold project statistics,
          recent activity, members, task progress, or quick actions.
        </p>
      </div>

      <div className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
        <p className="text-sm font-medium text-slate-500">Quick actions</p>

        <div className="mt-5 space-y-3">
          <Link
            to="columns"
            relative="path"
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white"
          >
            <span>Open columns board</span>
            <span>→</span>
          </Link>

          <Link
            to={`/board/workspaces/${project.workspaceId}/members`}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white"
          >
            <span>View workspace members</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}