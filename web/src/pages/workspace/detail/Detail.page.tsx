import { Link, Outlet, useLoaderData } from "react-router-dom";
import { GetByIdLoader } from "../../../features/workspace/loader/getById";
import type {
  SafeMemberResponse,
  SafeWorkspaceDetailResponse,
} from "../../../../../api/src/modules/workspace/workspace.schemas";
import { WorkspaceNameSection } from "./Name.section";
import { PlusIcon } from "../../../components/ui/Icons";
import { StickySectionTabs } from "../../../components/ui/StickySectionTabs";

const tabs = [
  { to: "", label: "Overview", end: true },
  { to: "projects", label: "Projects" },
  { to: "leads", label: "Leads" },
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
    case "viewer":
      return "Viewer";
  }
}

const roleStyles: Record<SafeMemberResponse["role"], string> = {
  owner: "border-amber-200 bg-amber-50 text-amber-800",
  admin: "border-sky-200 bg-sky-50 text-sky-800",
  member: "border-emerald-200 bg-emerald-50 text-emerald-800",
  viewer: "border-slate-200 bg-slate-50 text-slate-700",
};

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
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {data.errorMessage ||
              data.formErrors?.[0] ||
              "Failed to load workspace."}
          </div>
        </div>
      </section>
    );
  }

  const workspace: SafeWorkspaceDetailResponse = {
    id: data.workspace.id,
    name: data.workspace.name,
    createdBy: data.workspace.createdBy,
    createdByName: data.workspace.createdByName,
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
    <section className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Link
          to="/board/workspaces"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          <span aria-hidden="true">&lt;-</span>
          <span>Workspaces</span>
        </Link>

        <header className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 border-b border-slate-100 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  Workspace
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${roleStyles[myMembership.role]}`}>
                  {getRoleLabel(myMembership.role)}
                </span>
              </div>

              <WorkspaceNameSection
                workspaceId={workspace.id}
                initialName={workspace.name}
                canRenameWorkspace={canRenameWorkspace}
              />

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                A focused space for projects, members, and day-to-day work.
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              {canInviteMember && (
                <Link
                  to={`/board/workspaces/${workspace.id}/invite`}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Invite member
                </Link>
              )}

              <Link
                to={`/board/workspaces/${workspace.id}/projects/new`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
              >
                <PlusIcon className="h-4 w-4" />
                Project
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            <div className="px-6 py-4 sm:px-8">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Created by
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold text-slate-800">
                {workspace.createdByName}
              </dd>
            </div>

            <div className="px-6 py-4 sm:px-8">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Joined as
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {getRoleLabel(myMembership.role)}
              </dd>
            </div>

            <div className="px-6 py-4 sm:px-8">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Created
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {formatDate(workspace.createdAt)}
              </dd>
            </div>

            <div className="px-6 py-4 sm:px-8">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Updated
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {formatDate(workspace.updatedAt)}
              </dd>
            </div>
          </dl>
        </header>

        <StickySectionTabs
          tabs={tabs}
          ariaLabel="Workspace sections"
          scopeLabel="Workspace"
          topClassName="top-2"
          zClassName="z-30"
        />

        <Outlet />
      </div>
    </section>
  );
}
