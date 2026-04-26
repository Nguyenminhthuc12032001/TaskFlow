import { Link, NavLink, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "../../features/auth/auth.store";
import { PlusIcon, UsersIcon } from "../ui/Icons";

type NavItem = {
    label: string;
    to: string;
    icon: (className: string) => ReactElement;
    end?: boolean;
    match?: (pathname: string) => boolean;
};

function DashboardIcon(className: string) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            <rect width="7" height="9" x="3" y="3" rx="1.5" />
            <rect width="7" height="5" x="14" y="3" rx="1.5" />
            <rect width="7" height="9" x="14" y="12" rx="1.5" />
            <rect width="7" height="5" x="3" y="16" rx="1.5" />
        </svg>
    );
}

function LeadsIcon(className: string) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="m7 15 4-4 3 3 5-7" />
            <path d="M15 7h4v4" />
        </svg>
    );
}

function SettingsIcon(className: string) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.4 7A2 2 0 1 1 7.2 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 20 7.2l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.8.8Z" />
        </svg>
    );
}

const primaryNav: NavItem[] = [
    {
        label: "Dashboard",
        to: "/board/workspaces",
        icon: DashboardIcon,
        match: (pathname) =>
            pathname === "/board" ||
            (pathname.startsWith("/board/workspaces") &&
                !pathname.startsWith("/board/workspaces/create")),
    },
    {
        label: "Leads",
        to: "/leads",
        icon: LeadsIcon,
    },
    {
        label: "Members",
        to: "/members",
        icon: (className) => <UsersIcon className={className} />,
    },
];

const workspaceNav: NavItem[] = [
    {
        label: "Settings",
        to: "/auth/change-password",
        icon: SettingsIcon,
    },
];

function getInitials(name?: string | null, email?: string | null) {
    const source = name || email || "TaskFlow";
    const initials = source
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("");

    return (initials || "TF").slice(0, 2).toUpperCase();
}

function SidebarLink({ item }: { item: NavItem }) {
    const location = useLocation();

    return (
        <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) => {
                const active = item.match ? item.match(location.pathname) : isActive;

                return [
                    "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                    active
                        ? "bg-zinc-950 text-white shadow-sm"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                ].join(" ");
            }}
        >
            {({ isActive }) => {
                const active = item.match ? item.match(location.pathname) : isActive;

                return (
                    <>
                        {item.icon(
                            [
                                "h-4 w-4 shrink-0 transition",
                                active ? "text-white" : "text-zinc-400 group-hover:text-zinc-700",
                            ].join(" ")
                        )}
                        <span className="truncate">{item.label}</span>
                    </>
                );
            }}
        </NavLink>
    );
}

export function Sidebar() {
    const auth = useAuth();

    return (
        <aside className="hidden h-screen w-72 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
            <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-5">
                <Link
                    to="/board/workspaces"
                    className="flex min-w-0 items-center gap-3"
                    aria-label="TaskFlow dashboard"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white shadow-sm">
                        TF
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-zinc-950">
                            TaskFlow
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                            Work operating system
                        </span>
                    </span>
                </Link>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
                <nav className="space-y-1" aria-label="Primary navigation">
                    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Main
                    </p>
                    {primaryNav.map((item) => (
                        <SidebarLink key={item.label} item={item} />
                    ))}
                </nav>

                <nav className="space-y-1" aria-label="Workspace navigation">
                    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Workspace
                    </p>
                    {workspaceNav.map((item) => (
                        <SidebarLink key={item.label} item={item} />
                    ))}
                </nav>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-950">
                                New workspace
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                Create a focused space for projects and tasks.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/board/workspaces/create"
                        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Create
                    </Link>
                </div>
            </div>

            <div className="border-t border-zinc-200 p-4">
                <div className="flex min-w-0 items-center gap-3 rounded-lg bg-zinc-50 px-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                        {getInitials(auth.user?.name, auth.user?.email)}
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-zinc-950">
                            {auth.user?.name ?? "Guest"}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                            {auth.user?.email ?? "Not signed in"}
                        </span>
                    </span>
                </div>
            </div>
        </aside>
    );
}
