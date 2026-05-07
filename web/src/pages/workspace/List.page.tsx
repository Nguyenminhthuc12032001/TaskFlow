import type { FormEvent } from "react";
import { Link, useLoaderData, useNavigation, useSearchParams } from "react-router-dom";
import { ListByUserLoader } from "../../features/workspace/loader/listByUser";
import type { SafeWorkspacesResponse } from "../../../../api/src/modules/workspace/workspace.schemas";
import { EyeIcon, PlusIcon, XIcon } from "../../components/ui/Icons";
import { getQueryLink } from "../../app/shared/lib/query";

type WorkspaceItem = SafeWorkspacesResponse["data"][number];
type WorkspaceRole = WorkspaceItem["role"];

const roleFilterOptions: Array<{ value: "" | WorkspaceRole; label: string }> = [
    { value: "", label: "All roles" },
    { value: "owner", label: "Owner" },
    { value: "admin", label: "Admin" },
    { value: "member", label: "Member" },
    { value: "viewer", label: "Viewer" },
];

const defaultPageSizeOptions = [6, 10, 20, 50, 100];

function formatDate(value: string | Date) {
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function isWorkspaceRole(value: string | null): value is WorkspaceRole {
    return value === "owner" || value === "admin" || value === "member" || value === "viewer";
}

function getPageSizeOptions(currentLimit: number) {
    return Array.from(new Set([...defaultPageSizeOptions, currentLimit])).sort((a, b) => a - b);
}

export function ListWorkspacePage() {
    const data = useLoaderData<typeof ListByUserLoader>();
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();

    const isLoading = Boolean(navigation.location);
    const isError = "errorMessage" in data;

    if (isLoading) {
        return (
            <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                            <div className="mt-3 h-8 w-64 animate-pulse rounded-2xl bg-slate-200" />
                        </div>

                        <div className="h-11 w-40 animate-pulse rounded-2xl bg-slate-200" />
                    </div>

                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_160px_160px_120px_auto]">
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="h-5 w-40 animate-pulse rounded-lg bg-slate-200" />
                                    <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
                                </div>
                                <div className="mt-5 h-4 w-full animate-pulse rounded-lg bg-slate-200" />
                                <div className="mt-2 h-4 w-2/3 animate-pulse rounded-lg bg-slate-200" />
                                <div className="mt-6 flex items-center justify-between gap-3">
                                    <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-200" />
                                    <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200" />
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
                            Unable to load workspaces
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
                                to="/board/workspaces/create"
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Create workspace
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const workspaces = data.data;
    const pagination = data.paginationMeta;
    const isEmpty = workspaces.length === 0;
    const query = searchParams.get("search")?.trim() ?? "";
    const roleFromUrl = searchParams.get("actorRole");
    const activeRole = isWorkspaceRole(roleFromUrl) ? roleFromUrl : "";
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";
    const pageSizeOptions = getPageSizeOptions(pagination.limit);
    const hasFilters = Boolean(query || activeRole || startDate || endDate);
    const filterKey = [query, activeRole, startDate, endDate, pagination.limit].join("|");
    const getPageLink = (page: number) =>
        getQueryLink(searchParams, { page, limit: pagination.limit });

    function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const nextSearch = formData.get("search")?.toString().trim() ?? "";
        const nextRole = formData.get("actorRole")?.toString() ?? "";
        const nextStartDate = formData.get("startDate")?.toString() ?? "";
        const nextEndDate = formData.get("endDate")?.toString() ?? "";
        const nextLimit = formData.get("limit")?.toString() ?? String(pagination.limit);
        const params = new URLSearchParams(searchParams);

        [
            ["search", nextSearch],
            ["actorRole", nextRole],
            ["startDate", nextStartDate],
            ["endDate", nextEndDate],
            ["limit", nextLimit],
        ].forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        params.set("page", "1");
        setSearchParams(params);
    }

    function handleClearFilters() {
        const params = new URLSearchParams(searchParams);

        params.delete("search");
        params.delete("actorRole");
        params.delete("startDate");
        params.delete("endDate");
        params.set("page", "1");
        setSearchParams(params);
    }

    return (
        <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                            Workspace
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            Your workspaces
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            Manage all your workspaces in one place with a clean and clear layout.
                        </p>
                    </div>

                    <Link
                        to="/board/workspaces/create"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Workspace
                    </Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <form
                        key={filterKey}
                        onSubmit={handleFilterSubmit}
                        className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_160px_160px_120px_auto]"
                    >
                        <label className="min-w-0">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Search
                            </span>
                            <input
                                name="search"
                                defaultValue={query}
                                placeholder="Name or creator"
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />
                        </label>

                        <label>
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                My role
                            </span>
                            <select
                                name="actorRole"
                                defaultValue={activeRole}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            >
                                {roleFilterOptions.map((option) => (
                                    <option key={option.value || "all"} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                From
                            </span>
                            <input
                                type="date"
                                name="startDate"
                                defaultValue={startDate}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />
                        </label>

                        <label>
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                To
                            </span>
                            <input
                                type="date"
                                name="endDate"
                                defaultValue={endDate}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />
                        </label>

                        <label>
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Per page
                            </span>
                            <select
                                name="limit"
                                defaultValue={String(pagination.limit)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            >
                                {pageSizeOptions.map((limit) => (
                                    <option key={limit} value={limit}>
                                        {limit}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 lg:flex-none"
                            >
                                Apply
                            </button>

                            {hasFilters ? (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                                    aria-label="Clear filters"
                                    title="Clear filters"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                    </form>
                </div>

                {isEmpty ? (
                    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-500">
                            TF
                        </div>

                        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
                            {hasFilters ? "No workspaces match these filters" : "No workspaces yet"}
                        </h1>

                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                            {hasFilters
                                ? "Try changing the search, role, or date range to find more workspaces."
                                : "Start by creating your first workspace to organize projects, members, and tasks more clearly."}
                        </p>

                        <div className="mt-8">
                            {hasFilters ? (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                                >
                                    Clear filters
                                </button>
                            ) : (
                                <Link
                                    to="/board/workspaces/create"
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Workspace
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {workspaces.map((workspace) => (
                            <article
                                key={workspace.id}
                                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/70"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                                            {workspace.name}
                                        </h2>
                                        <p className="mt-2 truncate text-xs text-slate-500">
                                            Created by {workspace.createdByName}
                                        </p>
                                    </div>

                                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${roleStyles[workspace.role]}`}>
                                        {getRoleLabel(workspace.role)}
                                    </span>
                                </div>

                                <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Created
                                        </dt>
                                        <dd className="mt-1 font-medium text-slate-800">
                                            {formatDate(workspace.createdAt)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Updated
                                        </dt>
                                        <dd className="mt-1 font-medium text-slate-800">
                                            {formatDate(workspace.updatedAt)}
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                    <span className="min-w-0 truncate text-xs text-slate-400">
                                        {workspace.id}
                                    </span>

                                    <Link
                                        to={`/board/workspaces/${workspace.id}`}
                                        className="group/detail-eye relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                        aria-label={`View detail for ${workspace.name}`}
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition group-hover/detail-eye:opacity-100">
                                            detail
                                        </span>
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {!isEmpty ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-slate-600">
                            Page <span className="font-semibold text-slate-900">{pagination.page}</span>
                            {" / "}
                            <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
                            {" - "}
                            Total <span className="font-semibold text-slate-900">{pagination.totalItems}</span> workspaces
                        </div>

                        <div className="flex items-center gap-3">
                            {pagination.hasPrevPage ? (
                                <Link
                                    to={getPageLink(pagination.page - 1)}
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
                                    to={getPageLink(pagination.page + 1)}
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
                ) : null}
            </div>
        </section>
    );
}

function getRoleLabel(role: WorkspaceItem["role"]) {
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

const roleStyles: Record<WorkspaceItem["role"], string> = {
    owner: "border-amber-200 bg-amber-50 text-amber-800",
    admin: "border-sky-200 bg-sky-50 text-sky-800",
    member: "border-emerald-200 bg-emerald-50 text-emerald-800",
    viewer: "border-slate-200 bg-slate-50 text-slate-700",
};
