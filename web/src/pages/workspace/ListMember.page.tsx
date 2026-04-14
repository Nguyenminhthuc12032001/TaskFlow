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
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (normalized === "admin") {
        return "border-sky-200 bg-sky-50 text-sky-700";
    }

    if (normalized === "member") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
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
            <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                            <div className="mt-3 h-8 w-56 animate-pulse rounded-2xl bg-slate-200" />
                        </div>

                        <div className="h-11 w-32 animate-pulse rounded-2xl bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />
                                    <div className="flex-1">
                                        <div className="h-5 w-32 animate-pulse rounded-lg bg-slate-200" />
                                        <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-slate-200" />
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <div className="h-4 w-full animate-pulse rounded-lg bg-slate-200" />
                                    <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <div className="h-10 w-24 animate-pulse rounded-2xl bg-slate-200" />
                                    <div className="h-10 w-28 animate-pulse rounded-2xl bg-slate-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <div className="rounded-[28px] border border-red-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
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
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                Try again
                            </button>

                            <Link
                                to=".."
                                relative="path"
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Back
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const members = data.data;
    const pagination = data.paginationMeta;
    const isEmpty = members.length === 0;

    if (isEmpty) {
        return (
            <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-4xl border border-white/70 bg-white/85 p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                            👥
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
                                to="../settings"
                                relative="path"
                                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                            >
                                Manage workspace
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
                        to="../settings"
                        relative="path"
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                    >
                        Manage access
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {members.map((member) => (
                        <article
                            key={member.user.id}
                            className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
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

                                <div
                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getRoleStyle(member.role)}`}
                                >
                                    {formatRole(member.role)}
                                </div>
                            </div>

                            <dl className="mt-6 space-y-3 text-sm text-slate-600">
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-slate-500">User ID</dt>
                                    <dd className="max-w-[60%] truncate text-right font-medium text-slate-900">
                                        {member.user.id}
                                    </dd>
                                </div>

                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-slate-500">Joined at</dt>
                                    <dd className="text-right font-medium text-slate-900">
                                        {formatDate(member.joinedAt)}
                                    </dd>
                                </div>
                            </dl>

                            <div className="mt-6 flex items-center gap-3">
                                <a
                                    href={`mailto:${member.user.email}`}
                                    className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                                >
                                    Email
                                </a>

                                <button
                                    type="button"
                                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    More
                                </button>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/85 px-5 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-600">
                        Page <span className="font-semibold text-slate-900">{pagination.page}</span>
                        {" / "}
                        <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
                        {" • "}
                        Total <span className="font-semibold text-slate-900">{pagination.totalItems}</span> members
                    </div>

                    <div className="flex items-center gap-3">
                        {pagination.hasPrevPage ? (
                            <Link
                                to={`?page=${pagination.page - 1}&limit=${pagination.limit}`}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Previous
                            </Link>
                        ) : (
                            <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-400 opacity-50">
                                Previous
                            </span>
                        )}

                        {pagination.hasNextPage ? (
                            <Link
                                to={`?page=${pagination.page + 1}&limit=${pagination.limit}`}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Next
                            </Link>
                        ) : (
                            <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-400 opacity-50">
                                Next
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}