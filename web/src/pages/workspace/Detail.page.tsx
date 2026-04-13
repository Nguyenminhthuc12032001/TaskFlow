import { Link, NavLink, Outlet, useLoaderData } from "react-router-dom";
import { GetByIdLoader } from "../../features/workspace/loader/getById";
import type { SafeWorkspaceResponse } from "../../features/workspace/workspace.schema";

const tabs = [
  { to: "", label: "Overview", end: true },
  { to: "projects", label: "Projects" },
  { to: "members", label: "Members" },
  { to: "activity", label: "Activity" },
  { to: "settings", label: "Settings" },
];

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function WorkspaceDetailPage() {
  const data = useLoaderData<typeof GetByIdLoader>();

  const isError =
    "errorMessage" in data ||
    "formErrors" in data ||
    "fieldErrors" in data;

  if (isError) {
    return (
      <section className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {data.errorMessage || data.formErrors?.[0] || "Failed to load workspace."}
        </div>
      </section>
    );
  }

  const workspace: SafeWorkspaceResponse = {
    id: data.id,
    name: data.name,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };

  return (
    <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <Link
            to="/board"
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:border-slate-200 hover:bg-white hover:text-slate-900"
          >
            <span className="text-base leading-none">←</span>
            <span>Back to Board</span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-4xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Workspace
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {workspace.name}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Workspace information and management area.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Invite member
              </button>

              <button className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800">
                New project
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 sm:grid-cols-3 sm:p-6">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Created by</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                {workspace.createdBy}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Created at</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                {formatDate(workspace.createdAt)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-500">Updated at</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                {formatDate(workspace.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/70 bg-white/80 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <nav className="flex min-w-max items-center gap-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to + tab.label}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  [
                    "rounded-2xl px-4 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="overflow-hidden rounded-4xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
}