import { Link, useLoaderData, useNavigation, useParams } from "react-router-dom";
import type { ProjectsByWorkspaceLoader } from "../../../features/project/loader/listByWorkspace.loader";
import { EyeIcon, PlusIcon } from "../../../components/ui/Icons";

function formatDate(value: string | Date) {
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function getDescriptionPreview(description: string) {
    const trimmed = description.trim();

    if (!trimmed) {
        return "No description has been added for this project yet.";
    }

    return trimmed;
}

export function ListProjectsPage() {
    const data = useLoaderData<typeof ProjectsByWorkspaceLoader>();
    const navigation = useNavigation();
    const { workspaceId } = useParams();

    const isLoading = Boolean(navigation.location);
    const isError =
        "errorMessage" in data || "formErrors" in data || "fieldErrors" in data;

    if (isLoading) {
        return (
            <div>
                <div>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                            <div className="mt-3 h-8 w-64 animate-pulse rounded-2xl bg-slate-200" />
                            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-2xl bg-slate-200" />
                        </div>

                        <div className="h-11 w-36 animate-pulse rounded-xl bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="h-6 w-44 animate-pulse rounded-lg bg-slate-200" />
                                        <div className="mt-3 h-4 w-32 animate-pulse rounded-lg bg-slate-200" />
                                    </div>

                                    <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
                                </div>

                                <div className="mt-5 h-4 w-full animate-pulse rounded-lg bg-slate-200" />
                                <div className="mt-2 h-4 w-5/6 animate-pulse rounded-lg bg-slate-200" />

                                <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                    <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-200" />
                                    <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        const message =
            "errorMessage" in data
                ? data.errorMessage
                : "formErrors" in data
                    ? data.formErrors?.[0] ?? "Something went wrong while loading projects."
                    : "Unable to load projects.";

        return (
            <div>
                <div className="mx-auto max-w-3xl">
                    <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
                        <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                            Load failed
                        </div>

                        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                            Unable to load projects
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                Try again
                            </button>

                            {workspaceId ? (
                                <Link
                                    to={`/board/workspaces/${workspaceId}/projects/new`}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Create project
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const projects = data.data;
    const pagination = data.paginationMeta;
    const isEmpty = projects.length === 0;

    if (isEmpty) {
        return (
            <div>
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-500">
                            PR
                        </div>

                        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
                            No projects yet
                        </h1>

                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                            Create your first project to start organizing tasks, progress, and
                            collaboration inside this workspace.
                        </p>

                        {workspaceId ? (
                            <div className="mt-8">
                                <Link
                                    to={`/board/workspaces/${workspaceId}/projects/new`}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Project
                                </Link>
                            </div>
                        ) : null}
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
                            Project
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            Workspace projects
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            View and manage all projects inside this workspace in one clean and
                            focused place.
                        </p>
                    </div>

                    {workspaceId ? (
                        <Link
                            to="new"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Project
                        </Link>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                        <article
                            key={project.id}
                            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/70"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                                        {project.name}
                                    </h2>
                                    <p className="mt-2 truncate text-xs text-slate-500">
                                        Created {formatDate(project.createdAt)}
                                    </p>
                                </div>

                                <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
                                    Project
                                </span>
                            </div>

                            <p className="mt-5 line-clamp-3 min-h-18 text-sm leading-6 text-slate-600">
                                {getDescriptionPreview(project.description)}
                            </p>

                            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                <span className="min-w-0 truncate text-xs text-slate-400">
                                    {project.id}
                                </span>

                                <Link
                                    to={`${project.id}`}
                                    className="group/detail-eye relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                    aria-label={`View detail for ${project.name}`}
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

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-600">
                        Page <span className="font-semibold text-slate-900">{pagination.page}</span>
                        {" / "}
                        <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
                        {" - "}
                        Total{" "}
                        <span className="font-semibold text-slate-900">
                            {pagination.totalItems}
                        </span>{" "}
                        projects
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
