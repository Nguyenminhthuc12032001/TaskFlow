import { Link, useLoaderData, useNavigation } from "react-router-dom";
import type { ListMemberLoader } from "../../features/workspace/loader/listMember";

function formatDate(value: string | Date) {
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function formatRole(role: string) {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function getRoleStyle(role: string) {
    const normalized = role.toLowerCase();

    if (normalized === "owner") {
        return "border-amber-200 bg-amber-50 text-amber-800";
    }

    if (normalized === "admin") {
        return "border-sky-200 bg-sky-50 text-sky-800";
    }

    if (normalized === "member") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    return "border-slate-200 bg-slate-50 text-slate-700";
}

export function ListMemberPage() {
    const data = useLoaderData<typeof ListMemberLoader>();
    const navigation = useNavigation();

    const isLoading = Boolean(navigation.location);
    const isError = "errorMessage" in data;

    if (isLoading) {
        return (
            <div>
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                        <div className="mt-3 h-8 w-56 animate-pulse rounded-2xl bg-slate-200" />
                    </div>

                    <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-200" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
                                <div className="min-w-0 flex-1">
                                    <div className="h-5 w-32 animate-pulse rounded-lg bg-slate-200" />
                                    <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-slate-200" />
                                </div>
                                <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-200" />
                                <div className="h-10 w-20 animate-pulse rounded-xl bg-slate-200" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mx-auto max-w-3xl">
                <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
                    <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                        Load failed
                    </div>

                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                        Unable to load members
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        {data.errorMessage}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            Try again
                        </button>

                        <Link
                            to=".."
                            relative="path"
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const members = data.data;
    const pagination = data.paginationMeta;
    const isEmpty = members.length === 0;

    if (isEmpty) {
        return (
            <div className="mx-auto max-w-4xl">
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-500">
                        MB
                    </div>

                    <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
                        No members yet
                    </h1>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                        This workspace does not have any members yet. Invite people to start
                        collaborating together.
                    </p>

                    <div className="mt-8">
                        <Link
                            to="../invite"
                            relative="path"
                            className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                        >
                            Invite member
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                        Members
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Workspace members
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                        View everyone in this workspace, their role, and when they joined.
                    </p>
                </div>

                <Link
                    to="../invite"
                    relative="path"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                >
                    Invite member
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {members.map((member) => (
                    <article
                        key={member.user.id}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/70"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                                    {getInitials(member.user.name)}
                                </div>

                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                                        {member.user.name}
                                    </h2>
                                    <p className="truncate text-sm text-slate-500">
                                        {member.user.email}
                                    </p>
                                </div>
                            </div>

                            <span
                                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getRoleStyle(member.role)}`}
                            >
                                {formatRole(member.role)}
                            </span>
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <span className="text-xs text-slate-400">
                                Joined {formatDate(member.joinedAt)}
                            </span>

                            <a
                                href={`mailto:${member.user.email}`}
                                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                Email
                            </a>
                        </div>
                    </article>
                ))}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                    Page <span className="font-semibold text-slate-900">{pagination.page}</span>
                    {" / "}
                    <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
                    {" - "}
                    Total <span className="font-semibold text-slate-900">{pagination.totalItems}</span> members
                </div>

                <div className="flex items-center gap-3">
                    {pagination.hasPrevPage ? (
                        <Link
                            to={`?page=${pagination.page - 1}&limit=${pagination.limit}`}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Previous
                        </Link>
                    ) : (
                        <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-400 opacity-50">
                            Previous
                        </span>
                    )}

                    {pagination.hasNextPage ? (
                        <Link
                            to={`?page=${pagination.page + 1}&limit=${pagination.limit}`}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Next
                        </Link>
                    ) : (
                        <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-400 opacity-50">
                            Next
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
