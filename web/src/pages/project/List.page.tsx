import { Link, useLoaderData, useNavigation, useParams } from "react-router-dom";
import type { ProjectsByWorkspaceLoader } from "../../features/project/loader/listByWorkspace.loader";

function formatDate(value: string | Date) {
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
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
            <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                            <div className="mt-3 h-8 w-64 animate-pulse rounded-2xl bg-slate-200" />
                            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-2xl bg-slate-200" />
                        </div>

                        <div className="h-11 w-36 animate-pulse rounded-2xl bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="h-5 w-20 animate-pulse rounded-lg bg-slate-200" />
                                        <div className="mt-4 h-6 w-40 animate-pulse rounded-lg bg-slate-200" />
                                    </div>

                                    <div className="h-9 w-20 animate-pulse rounded-2xl bg-slate-200" />
                                </div>

                                <div className="mt-4 h-4 w-full animate-pulse rounded-lg bg-slate-200" />
                                <div className="mt-2 h-4 w-5/6 animate-pulse rounded-lg bg-slate-200" />
                                <div className="mt-2 h-4 w-2/3 animate-pulse rounded-lg bg-slate-200" />

                                <div className="mt-6 space-y-3">
                                    <div className="h-4 w-full animate-pulse rounded-lg bg-slate-200" />
                                    <div className="h-4 w-4/5 animate-pulse rounded-lg bg-slate-200" />
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <div className="h-10 flex-1 animate-pulse rounded-2xl bg-slate-200" />
                                    <div className="h-10 w-24 animate-pulse rounded-2xl bg-slate-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
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
            <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <div className="rounded-[28px] border border-red-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
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
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                Try again
                            </button>

                            {workspaceId ? (
                                <Link
                                    to={`/board/workspaces/${workspaceId}/projects/create`}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Create project
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const projects = data.data;
    const pagination = data.paginationMeta;
    const isEmpty = projects.length === 0;

    if (isEmpty) {
        return (
            <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-4xl border border-white/70 bg-white/85 p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                            📁
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
                                    to={`/board/workspaces/${workspaceId}/projects/create`}
                                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                                >
                                    Create first project
                                </Link>
                            </div>
                        ) : null}
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
                            to='new'
                            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                        >
                            + New project
                        </Link>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                        <article
                            key={project.id}
                            className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                        Project
                                    </div>

                                    <h2 className="mt-4 truncate text-xl font-semibold tracking-tight text-slate-900">
                                        {project.name}
                                    </h2>
                                </div>

                                <div className="max-w-40 truncate rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                                    ID: {project.id}
                                </div>
                            </div>

                            <p className="mt-4 min-h-18 text-sm leading-6 text-slate-600">
                                {project.description?.trim()
                                    ? project.description
                                    : "No description has been added for this project yet."}
                            </p>

                            <dl className="mt-6 space-y-3 text-sm text-slate-600">
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-slate-500">Workspace</dt>
                                    <dd className="text-right font-medium text-slate-900">
                                        {project.workspaceId}
                                    </dd>
                                </div>

                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-slate-500">Created by</dt>
                                    <dd className="text-right font-medium text-slate-900">
                                        {project.createdBy}
                                    </dd>
                                </div>

                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-slate-500">Created at</dt>
                                    <dd className="text-right font-medium text-slate-900">
                                        {formatDate(project.createdAt)}
                                    </dd>
                                </div>
                            </dl>

                            <div className="mt-6 flex items-center ">
                                <Link
                                    to={`${project.id}`}
                                    className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                                >
                                    Open
                                </Link> 
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