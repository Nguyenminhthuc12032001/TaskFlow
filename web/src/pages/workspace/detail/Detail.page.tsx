import { Link, NavLink, Outlet, useLoaderData } from "react-router-dom";
import { GetByIdLoader } from "../../../features/workspace/loader/getById";
import type {
  SafeMemberResponse,
  SafeWorkspaceResponse,
} from "../../../../../api/src/modules/workspace/workspace.schemas";
import { WorkspaceNameSection } from "./Name.section";

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

function getRoleLabel(role: SafeMemberResponse["role"]) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "member":
      return "Member";
    default:
      return "Viewer";
  }
}

export function WorkspaceDetailPage() {
  const data = useLoaderData<typeof GetByIdLoader>();

  const isError =
    "errorMessage" in data ||
    "formErrors" in data ||
    "fieldErrors" in data;

  if (isError) {
    return (
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-700 shadow-sm">
            {data.errorMessage ||
              data.formErrors?.[0] ||
              "Failed to load workspace."}
          </div>
        </div>
      </section>
    );
  }

  const workspace: SafeWorkspaceResponse = {
    id: data.workspace.id,
    name: data.workspace.name,
    createdBy: data.workspace.createdBy,
    createdAt: data.workspace.createdAt,
    updatedAt: data.workspace.updatedAt,
  };

  const myMembership: SafeMemberResponse = {
    user: {
      id: data.myMembership.user.id,
      name: data.myMembership.user.name,
      email: data.myMembership.user.email,
    },
    role: data.myMembership.role,
    joinedAt: data.myMembership.joinedAt,
  };

  const role = myMembership.role;

  const canManageWorkspace = role === "owner" || role === "admin";
  const canInviteMember = canManageWorkspace;
  const canRenameWorkspace = canManageWorkspace;

  return (
    <section className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.10),_transparent_32%),linear-gradient(to_bottom,_#ffffff,_#f8fafc,_#f1f5f9)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <Link
            to="/board"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900"
          >
            <span className="text-base leading-none">←</span>
            <span>Back to Board</span>
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-slate-100/80 via-white/30 to-slate-100/70" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-slate-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-slate-100/70 blur-2xl" />

          <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Workspace
                </div>

                <div className="space-y-3">
                  <WorkspaceNameSection
                    workspaceId={workspace.id}
                    initialName={workspace.name}
                    canRenameWorkspace={canRenameWorkspace}
                  />

                  <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-[15px]">
                    A clean management space for projects, members, activity,
                    and workspace settings.
                  </p>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                {canInviteMember && (
                  <Link
                    to={`/board/workspaces/${workspace.id}/invite`}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Invite member
                  </Link>
                )}

                <Link
                  to={`/board/workspaces/${workspace.id}/projects/new`}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  New project
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Created by
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700 break-all">
                  {workspace.createdBy}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Your role
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  {getRoleLabel(myMembership.role)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Created at
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  {formatDate(workspace.createdAt)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Updated at
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  {formatDate(workspace.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-4 z-10 overflow-x-auto rounded-[28px] border border-white/80 bg-white/85 p-2 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <nav
            className="flex min-w-max items-center gap-2"
            aria-label="Workspace sections"
          >
            {tabs.map((tab) => (
              <NavLink
                key={tab.to + tab.label}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  [
                    "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-slate-100/80 px-5 py-4 sm:px-6 lg:px-8">
            <p className="text-sm font-medium text-slate-500">
              Workspace content
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
}