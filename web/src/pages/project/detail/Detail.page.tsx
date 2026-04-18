import { Link, useLoaderData, useRouteLoaderData } from "react-router-dom";
import type { ProjectByIdLoader } from "../../../features/project/loader/getById.loader";
import type { GetByIdLoader } from "../../../features/workspace/loader/getById";
import { ProjectIdentitySection } from "./ProjectIdentity.section";

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function ProjectPage() {
  const data = useLoaderData<typeof ProjectByIdLoader>();
  const workspaceData = useRouteLoaderData<typeof GetByIdLoader>("workspace-detail")
  const role = workspaceData?.myMembership?.role

  const canEditProject =
    !!workspaceData &&
    !("errorMessage" in workspaceData) &&
    !("formErrors" in workspaceData) &&
    !("fieldErrors" in workspaceData) &&
    (role === "owner" || role === "admin");

  const isError =
    "errorMessage" in data || "formErrors" in data || "fieldErrors" in data;

  if (isError) {
    const message =
      ("errorMessage" in data && data.errorMessage) ||
      ("formErrors" in data && data.formErrors?.[0]) ||
      "Something went wrong while loading this project.";

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-4xl border border-red-100 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="border-b border-red-100 bg-red-50/80 px-6 py-5">
              <p className="text-sm font-medium text-red-600">Project load failed</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Unable to display this project
              </h1>
            </div>

            <div className="px-6 py-6">
              <p className="text-sm leading-7 text-slate-600">{message}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to=".."
                  relative="path"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Back
                </Link>

                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Go home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const project = data;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(241,245,249,1))] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to=".."
            relative="path"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white"
          >
            ← Back
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/workspaces/${project.workspaceId}/projects/${project.id}/tasks`}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              View tasks
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-[36px] border border-white/60 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-100 px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Project overview
            </div>

            <ProjectIdentitySection 
              initialName={project.name}
              initialDescription={project.description}
              canEditProject={canEditProject}
            />
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                Project ID
              </p>
              <p className="mt-3 break-all text-sm font-medium text-slate-900">
                {project.id}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                Workspace ID
              </p>
              <p className="mt-3 break-all text-sm font-medium text-slate-900">
                {project.workspaceId}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                Created by
              </p>
              <p className="mt-3 text-sm font-medium text-slate-900">
                {project.createdBy}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                Created at
              </p>
              <p className="mt-3 text-sm font-medium text-slate-900">
                {formatDate(project.createdAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
            <p className="text-sm font-medium text-slate-500">About this project</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Clean and focused information
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              This section gives a calm and premium presentation style. The goal is not to
              overload the screen, but to make the project name, description, and metadata
              feel clear and well structured.
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
                to="edit"
                relative="path"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white"
              >
                <span>Update project details</span>
                <span>→</span>
              </Link>

              <Link
                to={`/workspaces/${project.workspaceId}/projects/${project.id}/tasks`}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white"
              >
                <span>Open task board</span>
                <span>→</span>
              </Link>

              <Link
                to={`/workspaces/${project.workspaceId}/members`}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white"
              >
                <span>View workspace members</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}