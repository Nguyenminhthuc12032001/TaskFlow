import { Link, useLocation } from "react-router-dom";
import { PlusIcon } from "../ui/Icons";
import { UserMenu } from "./UserMenu";

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/leads") || pathname.includes("/leads")) return "Leads";
  if (pathname.startsWith("/members")) return "Members";
  if (pathname.includes("/projects")) return "Projects";
  if (pathname.includes("/tasks")) return "Tasks";
  if (pathname.startsWith("/board/workspaces/create")) return "New workspace";
  if (pathname.startsWith("/board/workspaces")) return "Dashboard";

  return "Dashboard";
}

export function Topbar() {
  const location = useLocation();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/board/workspaces"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-xs font-semibold text-white lg:hidden"
          aria-label="TaskFlow dashboard"
        >
          TF
        </Link>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-950">
            {getPageTitle(location.pathname)}
          </p>
          <p className="hidden truncate text-xs text-zinc-500 sm:block">
            Plan, assign, and track the work that matters.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/board/workspaces/create"
          className="hidden h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 sm:inline-flex"
        >
          <PlusIcon className="h-4 w-4" />
          Workspace
        </Link>

        <UserMenu />
      </div>
    </header>
  );
}
