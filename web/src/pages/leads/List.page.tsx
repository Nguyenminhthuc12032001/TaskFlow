import type { FormEvent } from "react";
import {
    Link,
    useLoaderData,
    useNavigation,
    useParams,
    useSearchParams,
} from "react-router-dom";
import type { ListLeadByWorkspaceLoader } from "../../features/lead/loader/listByWorkspace.loader";
import type { ListLeadByUserWorkspacesLoader } from "../../features/lead/loader/listByUserWorkspaces.loader";
import { EyeIcon, PlusIcon, XIcon } from "../../components/ui/Icons";
import { getQueryLink } from "../../app/shared/lib/query";

type WorkspaceLoaderData = Awaited<ReturnType<typeof ListLeadByWorkspaceLoader>>;
type UserWorkspacesLoaderData = Awaited<ReturnType<typeof ListLeadByUserWorkspacesLoader>>;
type LoaderData = WorkspaceLoaderData | UserWorkspacesLoaderData;
type LeadListData = Extract<LoaderData, { data: unknown[] }>;
type LeadItem = LeadListData["data"][number];
type LeadStageValue = LeadItem["stage"];
type StageFilter = LeadStageValue | "all";

const stageMeta: Record<
    LeadStageValue,
    {
        label: string;
        className: string;
        activeClassName: string;
        dotClassName: string;
    }
> = {
    new: {
        label: "New",
        className: "border-sky-200 bg-sky-50 text-sky-700",
        activeClassName: "border-sky-300 bg-sky-50 text-sky-800 shadow-sm",
        dotClassName: "bg-sky-500",
    },
    contacted: {
        label: "Contacted",
        className: "border-indigo-200 bg-indigo-50 text-indigo-700",
        activeClassName: "border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm",
        dotClassName: "bg-indigo-500",
    },
    qualified: {
        label: "Qualified",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        activeClassName: "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm",
        dotClassName: "bg-emerald-500",
    },
    won: {
        label: "Won",
        className: "border-lime-200 bg-lime-50 text-lime-700",
        activeClassName: "border-lime-300 bg-lime-50 text-lime-800 shadow-sm",
        dotClassName: "bg-lime-500",
    },
    lost: {
        label: "Lost",
        className: "border-rose-200 bg-rose-50 text-rose-700",
        activeClassName: "border-rose-300 bg-rose-50 text-rose-800 shadow-sm",
        dotClassName: "bg-rose-500",
    },
};

const stageValues = Object.keys(stageMeta) as LeadStageValue[];
const stageFilterOptions: Array<{ value: StageFilter; label: string }> = [
    { value: "all", label: "All" },
    ...stageValues.map((stage) => ({
        value: stage,
        label: stageMeta[stage].label,
    })),
];

function isLeadListData(data: LoaderData): data is LeadListData {
    return (
        !!data &&
        typeof data === "object" &&
        "data" in data &&
        Array.isArray(data.data) &&
        "paginationMeta" in data
    );
}

function getErrorMessage(data: LoaderData) {
    if (!data || typeof data !== "object") {
        return "Something went wrong while loading leads.";
    }

    if ("errorMessage" in data && data.errorMessage) {
        return data.errorMessage;
    }

    if ("formErrors" in data && data.formErrors?.[0]) {
        return data.formErrors[0];
    }

    return "Unable to load leads.";
}

function isLeadStage(value: string | null): value is LeadStageValue {
    return !!value && value in stageMeta;
}

function formatDate(value: string | Date) {
    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function getContactText(lead: LeadItem) {
    const contact = [lead.email, lead.phone].filter(Boolean);

    return contact.length > 0 ? contact.join(" / ") : "No contact yet";
}

function getSourceText(source: LeadItem["source"]) {
    return source?.trim() || "No source";
}

function leadMatchesQuery(lead: LeadItem, query: string) {
    if (!query) return true;

    const haystack = [
        lead.name,
        lead.email,
        lead.phone,
        lead.source,
        lead.note,
        lead.stage,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return haystack.includes(query.toLowerCase());
}

function StageBadge({ stage }: { stage: LeadStageValue }) {
    const meta = stageMeta[stage];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`} />
            {meta.label}
        </span>
    );
}

function LeadAvatar({ lead }: { lead: LeadItem }) {
    return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
            {getInitials(lead.name)}
        </span>
    );
}

function LeadListSkeleton() {
    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-3 h-7 w-52 animate-pulse rounded-lg bg-slate-200" />
                    <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded-lg bg-slate-200" />
                </div>

                <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-200" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="h-10 flex-1 animate-pulse rounded-lg bg-slate-200" />
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-8 w-24 animate-pulse rounded-full bg-slate-200"
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0"
                    >
                        <div className="h-5 animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-5 animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-5 animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-5 animate-pulse rounded-lg bg-slate-200" />
                    </div>
                ))}
            </div>
        </section>
    );
}

export function ListLeadPage() {
    const data = useLoaderData() as LoaderData;
    const navigation = useNavigation();
    const { workspaceId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const isGlobalList = !workspaceId;
    const createLeadLink = isGlobalList ? "/board/workspaces" : "create";
    const createLeadLabel = isGlobalList ? "Workspace" : "Lead";
    const isLoading = Boolean(navigation.location);

    if (isLoading) {
        return <LeadListSkeleton />;
    }

    if (!isLeadListData(data)) {
        return (
            <section className="mx-auto max-w-3xl">
                <div className="rounded-xl border border-red-200 bg-white p-8 shadow-sm">
                    <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                        Load failed
                    </div>

                    <h1 className="mt-4 text-2xl font-semibold text-slate-900">
                        Unable to load leads
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        {getErrorMessage(data)}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            Try again
                        </button>

                        <Link
                            to={createLeadLink}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <PlusIcon className="h-4 w-4" />
                            {createLeadLabel}
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    const leads = data.data;
    const pagination = data.paginationMeta;
    const query = (searchParams.get("search") ?? searchParams.get("q"))?.trim() ?? "";
    const stageFromUrl = searchParams.get("stage");
    const activeStage = isLeadStage(stageFromUrl) ? stageFromUrl : null;
    const hasFilters = Boolean(query) || Boolean(activeStage);

    const stageCounts = stageValues.reduce(
        (acc, stage) => ({
            ...acc,
            [stage]: leads.filter((lead) => lead.stage === stage).length,
        }),
        {} as Record<LeadStageValue, number>
    );

    const visibleLeads = leads.filter((lead) => {
        const stageMatches = activeStage ? lead.stage === activeStage : true;

        return stageMatches && leadMatchesQuery(lead, query);
    });
    const activeStageLabel = activeStage ? stageMeta[activeStage].label : "All stages";

    function updateParams(next: Record<string, string | null>) {
        const params = new URLSearchParams(searchParams);
        params.delete("q");

        Object.entries(next).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        params.set("page", "1");
        setSearchParams(params);
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const nextQuery = formData.get("q")?.toString().trim() ?? "";

        updateParams({ search: nextQuery || null, q: null });
    }

    function handleStageFilter(stage: StageFilter) {
        updateParams({ stage: stage === "all" ? null : stage });
    }

    function handleClearFilters() {
        const params = new URLSearchParams(searchParams);
        params.delete("q");
        params.delete("search");
        params.delete("stage");
        params.set("page", "1");
        setSearchParams(params);
    }

    function getPageLink(page: number) {
        return getQueryLink(searchParams, { page, limit: pagination.limit });
    }

    function getLeadDetailLink(lead: LeadItem) {
        return isGlobalList
            ? `/board/workspaces/${lead.workspaceId}/leads/${lead.id}`
            : lead.id;
    }

    if (leads.length === 0) {
        return (
            <section className="mx-auto max-w-4xl">
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-500">
                        LD
                    </div>

                    <h1 className="mt-5 text-2xl font-semibold text-slate-900">
                        No leads yet
                    </h1>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                        {isGlobalList
                            ? "Create the first lead from a workspace and keep follow-ups close to the work."
                            : "Create the first lead for this workspace and keep follow-ups close to the work."}
                    </p>

                    <div className="mt-8">
                        <Link
                            to={createLeadLink}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                        >
                            <PlusIcon className="h-4 w-4" />
                            {createLeadLabel}
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                            Leads
                        </span>
                        <span className="text-xs text-slate-400">
                            {pagination.totalItems} total
                        </span>
                    </div>
                    <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
                        {isGlobalList ? "All leads" : "Workspace leads"}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        {activeStageLabel} - {visibleLeads.length} visible on this page
                    </p>
                </div>

                <Link
                    to={createLeadLink}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                    <PlusIcon className="h-4 w-4" />
                    {createLeadLabel}
                </Link>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex flex-col gap-3 lg:flex-row"
                    >
                        <label className="sr-only" htmlFor="lead-search">
                            Search leads
                        </label>
                        <input
                            id="lead-search"
                            name="search"
                            defaultValue={query}
                            placeholder="Search by name, contact, source, note..."
                            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />
                        <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            Search
                        </button>
                    </form>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                        {stageFilterOptions.map((option) => {
                            const isActive =
                                option.value === "all"
                                    ? activeStage === null
                                    : activeStage === option.value;

                            const activeClassName =
                                option.value === "all"
                                    ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                                    : stageMeta[option.value].activeClassName;
                            const count =
                                option.value === "all"
                                    ? leads.length
                                    : stageCounts[option.value];

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleStageFilter(option.value)}
                                    className={[
                                        "inline-flex h-8 items-center justify-center gap-2 rounded-full border px-3 text-xs font-medium transition",
                                        isActive
                                            ? activeClassName
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                                    ].join(" ")}
                                >
                                    {option.value !== "all" ? (
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${stageMeta[option.value].dotClassName}`}
                                        />
                                    ) : null}
                                    {option.label}
                                    <span className={isActive ? "opacity-80" : "text-slate-400"}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="inline-flex h-8 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <XIcon className="h-3.5 w-3.5" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] divide-y divide-slate-100 text-left">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">
                                    Lead
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">
                                    Source
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">
                                    Stage
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">
                                    Note
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-slate-400">
                                    Created
                                </th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase text-slate-400">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {visibleLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <div className="mx-auto max-w-sm">
                                            <h3 className="text-base font-semibold text-slate-900">
                                                No leads match these filters
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                Adjust the search or stage filter to see more leads from this page.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleClearFilters}
                                                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                                            >
                                                Clear filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                visibleLeads.map((lead) => (
                                    <tr key={lead.id} className="transition hover:bg-slate-50/80">
                                        <td className="px-4 py-4">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <LeadAvatar lead={lead} />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {lead.name}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-slate-500">
                                                        {getContactText(lead)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="max-w-[190px] px-4 py-4">
                                            <p className="truncate text-sm text-slate-600">
                                                {getSourceText(lead.source)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <StageBadge stage={lead.stage} />
                                        </td>
                                        <td className="max-w-[300px] px-4 py-4">
                                            <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                                                {lead.note}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="whitespace-nowrap text-sm text-slate-500">
                                                {formatDate(lead.createdAt)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <Link
                                                to={getLeadDetailLink(lead)}
                                                className="group/detail-eye relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                                                aria-label={`View detail for ${lead.name}`}
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                                <span className="pointer-events-none absolute bottom-full right-0 z-10 mb-1 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition group-hover/detail-eye:opacity-100">
                                                    detail
                                                </span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                    Showing{" "}
                    <span className="font-semibold text-slate-900">
                        {visibleLeads.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-900">
                        {leads.length}
                    </span>{" "}
                    leads on page{" "}
                    <span className="font-semibold text-slate-900">
                        {pagination.page}
                    </span>{" "}
                    /{" "}
                    <span className="font-semibold text-slate-900">
                        {pagination.totalPages}
                    </span>
                    {" - "}
                    Total{" "}
                    <span className="font-semibold text-slate-900">
                        {pagination.totalItems}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {pagination.hasPrevPage ? (
                        <Link
                            to={getPageLink(pagination.page - 1)}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Previous
                        </Link>
                    ) : (
                        <span className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-400 opacity-50">
                            Previous
                        </span>
                    )}

                    {pagination.hasNextPage ? (
                        <Link
                            to={getPageLink(pagination.page + 1)}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Next
                        </Link>
                    ) : (
                        <span className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-400 opacity-50">
                            Next
                        </span>
                    )}
                </div>
            </div>
        </section>
    );
}
