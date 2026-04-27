import { Outlet, useLoaderData, useRouteLoaderData } from "react-router-dom";
import type { ProjectByIdLoader } from "../../../../features/project/loader/getById.loader";
import type { GetByIdLoader } from "../../../../features/workspace/loader/getById";
import { StickySectionTabs } from "../../../../components/ui/StickySectionTabs";
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
  const role =
    workspaceData &&
    !("errorMessage" in workspaceData) &&
    !("formErrors" in workspaceData) &&
    !("fieldErrors" in workspaceData)
      ? workspaceData.myMembership.role
      : undefined;

  const canEditProject = role === "owner" || role === "admin";
  const isError =
    "errorMessage" in data || "formErrors" in data || "fieldErrors" in data;

  if (isError) {
    const message =
      ("errorMessage" in data && data.errorMessage) ||
      ("formErrors" in data && data.formErrors?.[0]) ||
      "Something went wrong while loading this project.";

    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Project load error
          </div>
          <p className="mt-4 text-sm leading-7 text-red-600">{message}</p>
        </div>
      </div>
    );
  }

  const project = data;

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 border-b border-slate-100 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-4xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Project overview
              </span>

              {canEditProject && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Editable
                </span>
              )}
            </div>

            <ProjectIdentitySection
              initialName={project.name}
              initialDescription={project.description}
              canEditProject={canEditProject}
            />
          </div>
        </div>

        <dl className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-4 sm:px-8">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Created
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">
              {formatDate(project.createdAt)}
            </dd>
          </div>

          <div className="px-6 py-4 sm:px-8">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Project ID
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-slate-800">
              {project.id}
            </dd>
          </div>

          <div className="px-6 py-4 sm:px-8">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Workspace ID
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-slate-800">
              {project.workspaceId}
            </dd>
          </div>
        </dl>
      </header>

      <StickySectionTabs
        tabs={tabs}
        ariaLabel="Project sections"
        scopeLabel="Project"
        topClassName="top-[4.75rem]"
        zClassName="z-20"
      />

      <Outlet />
    </div>
  );
}
