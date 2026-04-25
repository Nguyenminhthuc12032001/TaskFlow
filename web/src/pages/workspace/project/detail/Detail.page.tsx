import { Link, NavLink, Outlet, useLoaderData, useRouteLoaderData } from "react-router-dom";
import type { ProjectByIdLoader } from "../../../../features/project/loader/getById.loader";
import type { GetByIdLoader } from "../../../../features/workspace/loader/getById";
import { ProjectIdentitySection } from "./ProjectIdentity.section";

const tabs = [
  { to: "", label: "Overview", end: true },
  { to: "columns", label: "Columns" },
  { to: "activity", label: "Activity" },
  { to: "settings", label: "Settings" },
];

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function ProjectPage() {
  const data = useLoaderData<typeof ProjectByIdLoader>();
  const workspaceData = useRouteLoaderData<typeof GetByIdLoader>("workspace-detail");
  const role = workspaceData?.myMembership?.role;

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
          <div className="overflow-hidden rounded-4xl border border-red-100 bg-white shadow-[0_20px_60px_rgba(239,68,68,0.08)]">
            <div className="border-b border-red-100 bg-red-50/70 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
                Project load error
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-7 text-red-600">{message}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const project = data;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(241,245,249,1)_42%,rgba(226,232,240,0.9)_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to=".."
            relative="path"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900"
          >
            <span className="text-base leading-none">←</span>
            <span>List projects</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Project detail
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(99,102,241,0.06),rgba(255,255,255,0))]" />

          <div className="relative border-b border-slate-100 px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/90 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Project overview
              </div>

              {canEditProject && (
                <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Editable
                </div>
              )}
            </div>

            <div className="max-w-4xl">
              <ProjectIdentitySection
                initialName={project.name}
                initialDescription={project.description}
                canEditProject={canEditProject}
              />
            </div>
          </div>

          <div className="grid gap-2.5 px-6 py-5 sm:grid-cols-2 sm:px-8 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Project ID
              </p>
              <p className="mt-1.5 break-all font-mono text-sm leading-6 text-slate-700">
                {project.id}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Workspace ID
              </p>
              <p className="mt-1.5 break-all font-mono text-sm leading-6 text-slate-700">
                {project.workspaceId}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Created by
              </p>
              <p className="mt-1.5 text-sm font-medium leading-6 text-slate-700 break-all">
                {project.createdBy}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Created at
              </p>
              <p className="mt-1.5 text-sm font-medium leading-6 text-slate-700">
                {formatDate(project.createdAt)}
              </p>
            </div>
          </div>
        </section>

        <div className="overflow-x-auto rounded-[30px] border border-white/70 bg-white/80 p-2 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <nav className="flex min-w-max items-center gap-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to + tab.label}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  [
                    "relative rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Content
            </p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.9))]">
              <Outlet />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}