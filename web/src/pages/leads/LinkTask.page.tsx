import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
    Link,
    useFetcher,
    useNavigate,
    useOutletContext,
    useParams,
} from "react-router-dom";
import type { SafeLeadDetailType } from "../../../../api/src/modules/lead/lead.schemas";
import type { ListProjectResponseType } from "../../../../api/src/modules/project/project.schemas";
import type { SafeColumnsType } from "../../../../api/src/modules/column/column.schemas";
import type { SafeTasks } from "../../../../api/src/modules/task/task.schemas";
import { CheckIcon, PlusIcon, XIcon } from "../../components/ui/Icons";
import type { ActionError } from "../../features/type";
import { columnApi } from "../../features/column/column.api";
import { projectApi } from "../../features/project/project.api";
import { taskApi } from "../../features/task/task.api";

type LeadDetailOutletContext = {
    lead: SafeLeadDetailType;
    canEditLead: boolean;
};

type ProjectItem = ListProjectResponseType["data"][number];
type ColumnItem = SafeColumnsType["data"][number];
type TaskItem = SafeTasks["data"][number];
type LoadStatus = "idle" | "loading" | "success" | "error";

const priorityClassName: Record<TaskItem["priority"], string> = {
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    high: "border-red-200 bg-red-50 text-red-700",
};

function isActionError(data: unknown): data is ActionError {
    return (
        !!data &&
        typeof data === "object" &&
        ("fieldErrors" in data || "formErrors" in data || "errorMessage" in data)
    );
}

function getErrorMessage(error: unknown) {
    if (isActionError(error)) {
        return error.errorMessage || error.formErrors?.[0] || "Something went wrong.";
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong.";
}

function formatDate(value: Date | string | undefined) {
    if (!value) return "No due date";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function selectClassName(hasError = false) {
    return [
        "h-11 w-full rounded-lg border bg-white px-3 text-sm font-medium text-slate-800 outline-none transition",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
        hasError
            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
    ].join(" ");
}

function StatusMessage({
    title,
    message,
    action,
}: {
    title: string;
    message: string;
    action?: ReactNode;
}) {
    return (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
            <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {message}
            </p>
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

function TaskLinkCard({
    task,
    action,
    disabled,
}: {
    task: TaskItem;
    action: string;
    disabled: boolean;
}) {
    const fetcher = useFetcher<unknown>();
    const navigate = useNavigate();
    const isSubmitting = fetcher.state !== "idle";
    const error = isActionError(fetcher.data)
        ? fetcher.data.errorMessage || fetcher.data.formErrors?.[0]
        : undefined;

    useEffect(() => {
        if (fetcher.state !== "idle") return;
        if (!fetcher.data || isActionError(fetcher.data)) return;

        navigate("..", { relative: "path" });
    }, [fetcher.data, fetcher.state, navigate]);

    return (
        <article className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${priorityClassName[task.priority]}`}
                        >
                            {task.priority}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {formatDate(task.dueDate)}
                        </span>
                    </div>

                    <h3 className="break-words text-sm font-semibold text-slate-950">
                        {task.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {task.description || "No description added yet."}
                    </p>
                </div>

                <fetcher.Form method="post" action={action} className="shrink-0">
                    <button
                        type="submit"
                        disabled={disabled || isSubmitting}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <CheckIcon className="h-4 w-4" />
                        {isSubmitting ? "Linking..." : "Link"}
                    </button>
                </fetcher.Form>
            </div>

            {error ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            ) : null}
        </article>
    );
}

export function LinkTaskPage() {
    const { lead, canEditLead } = useOutletContext<LeadDetailOutletContext>();
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [columns, setColumns] = useState<ColumnItem[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedColumnId, setSelectedColumnId] = useState("");
    const [projectsStatus, setProjectsStatus] = useState<LoadStatus>("idle");
    const [columnsStatus, setColumnsStatus] = useState<LoadStatus>("idle");
    const [tasksStatus, setTasksStatus] = useState<LoadStatus>("idle");
    const [projectsError, setProjectsError] = useState("");
    const [columnsError, setColumnsError] = useState("");
    const [tasksError, setTasksError] = useState("");

    useEffect(() => {
        if (!workspaceId) return;

        let isCancelled = false;

        Promise.resolve().then(() => {
            if (isCancelled) return;

            setProjectsStatus("loading");
            setProjectsError("");
        });

        projectApi
            .listByWorkspace(workspaceId, { page: 1, limit: 100 })
            .then((result) => {
                if (isCancelled) return;

                setProjects(result.data);
                if (result.data.length === 0) {
                    setColumns([]);
                    setTasks([]);
                    setSelectedColumnId("");
                }
                setSelectedProjectId((current) =>
                    current && result.data.some((project) => project.id === current)
                        ? current
                        : result.data[0]?.id ?? ""
                );
                setProjectsStatus("success");
            })
            .catch((error: unknown) => {
                if (isCancelled) return;

                setProjects([]);
                setSelectedProjectId("");
                setProjectsStatus("error");
                setProjectsError(getErrorMessage(error));
            });

        return () => {
            isCancelled = true;
        };
    }, [workspaceId]);

    useEffect(() => {
        if (!workspaceId || !selectedProjectId) return;

        let isCancelled = false;

        Promise.resolve().then(() => {
            if (isCancelled) return;

            setColumnsStatus("loading");
            setColumnsError("");
        });

        columnApi
            .listByProject(workspaceId, selectedProjectId)
            .then((result) => {
                if (isCancelled) return;

                const sortedColumns = [...result.data].sort(
                    (a, b) => a.position - b.position
                );

                setColumns(sortedColumns);
                setSelectedColumnId(sortedColumns[0]?.id ?? "");
                setColumnsStatus("success");
            })
            .catch((error: unknown) => {
                if (isCancelled) return;

                setColumns([]);
                setSelectedColumnId("");
                setColumnsStatus("error");
                setColumnsError(getErrorMessage(error));
            });

        return () => {
            isCancelled = true;
        };
    }, [workspaceId, selectedProjectId]);

    useEffect(() => {
        if (!workspaceId || !selectedProjectId || !selectedColumnId) return;

        let isCancelled = false;

        Promise.resolve().then(() => {
            if (isCancelled) return;

            setTasksStatus("loading");
            setTasksError("");
        });

        taskApi
            .listByColumn({
                workspaceId,
                projectId: selectedProjectId,
                columnId: selectedColumnId,
            })
            .then((result) => {
                if (isCancelled) return;

                const sortedTasks = [...result.data].sort(
                    (a, b) =>
                        (a.position ?? Number.POSITIVE_INFINITY) -
                        (b.position ?? Number.POSITIVE_INFINITY)
                );

                setTasks(sortedTasks);
                setTasksStatus("success");
            })
            .catch((error: unknown) => {
                if (isCancelled) return;

                setTasks([]);
                setTasksStatus("error");
                setTasksError(getErrorMessage(error));
            });

        return () => {
            isCancelled = true;
        };
    }, [workspaceId, selectedProjectId, selectedColumnId]);

    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId),
        [projects, selectedProjectId]
    );
    const selectedColumn = useMemo(
        () => columns.find((column) => column.id === selectedColumnId),
        [columns, selectedColumnId]
    );
    const linkedTaskIds = useMemo(
        () => new Set(lead.taskLinks.map((task) => task.id)),
        [lead.taskLinks]
    );
    const availableTasks = useMemo(
        () => tasks.filter((task) => !linkedTaskIds.has(task.id)),
        [linkedTaskIds, tasks]
    );

    function handleProjectChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedProjectId(event.currentTarget.value);
        setColumns([]);
        setTasks([]);
        setSelectedColumnId("");
        setColumnsStatus("idle");
        setTasksStatus("idle");
        setColumnsError("");
        setTasksError("");
    }

    function handleColumnChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedColumnId(event.currentTarget.value);
        setTasks([]);
        setTasksStatus("idle");
        setTasksError("");
    }

    if (!canEditLead) {
        return (
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <StatusMessage
                    title="You cannot link tasks"
                    message="Only the lead owner or workspace managers can link tasks to this lead."
                />
            </section>
        );
    }

    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div>
                    <p className="text-sm font-semibold text-slate-950">Link task</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Choose a project, then a column, then link an existing task to this lead.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("..", { relative: "path" })}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                    aria-label="Close link task"
                    title="Close"
                >
                    <XIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                        <label
                            htmlFor="link-project"
                            className="text-[11px] font-semibold uppercase text-slate-400"
                        >
                            Project
                        </label>
                        <select
                            id="link-project"
                            value={selectedProjectId}
                            onChange={handleProjectChange}
                            disabled={projectsStatus === "loading" || projects.length === 0}
                            className={selectClassName(projectsStatus === "error")}
                        >
                            {projects.length === 0 ? (
                                <option value="">
                                    {projectsStatus === "loading"
                                        ? "Loading projects..."
                                        : "No projects"}
                                </option>
                            ) : (
                                projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))
                            )}
                        </select>
                        {projectsError ? (
                            <p className="mt-2 text-sm text-red-600">{projectsError}</p>
                        ) : null}
                    </div>

                    <div>
                        <label
                            htmlFor="link-column"
                            className="text-[11px] font-semibold uppercase text-slate-400"
                        >
                            Column
                        </label>
                        <select
                            id="link-column"
                            value={selectedColumnId}
                            onChange={handleColumnChange}
                            disabled={
                                !selectedProjectId ||
                                columnsStatus === "loading" ||
                                columns.length === 0
                            }
                            className={selectClassName(columnsStatus === "error")}
                        >
                            {columns.length === 0 ? (
                                <option value="">
                                    {columnsStatus === "loading"
                                        ? "Loading columns..."
                                        : "No columns"}
                                </option>
                            ) : (
                                columns.map((column) => (
                                    <option key={column.id} value={column.id}>
                                        {column.name}
                                    </option>
                                ))
                            )}
                        </select>
                        {columnsError ? (
                            <p className="mt-2 text-sm text-red-600">{columnsError}</p>
                        ) : null}
                    </div>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <span className="font-semibold text-slate-900">
                                {selectedProject?.name || "No project"}
                            </span>
                            {" / "}
                            <span className="font-semibold text-slate-900">
                                {selectedColumn?.name || "No column"}
                            </span>
                            {" - "}
                            {availableTasks.length} available task
                            {availableTasks.length !== 1 ? "s" : ""}
                        </div>

                        {workspaceId && selectedProjectId && selectedColumnId ? (
                            <Link
                                to={`/board/workspaces/${workspaceId}/leads/${lead.id}/follow-up/${selectedProjectId}/${selectedColumnId}`}
                                state={{
                                    projectName: selectedProject?.name,
                                    columnName: selectedColumn?.name,
                                }}
                                className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                            >
                                <PlusIcon className="h-4 w-4" />
                                New follow-up
                            </Link>
                        ) : null}
                    </div>
                </div>

                {projectsStatus === "loading" ? (
                    <StatusMessage
                        title="Loading projects"
                        message="Finding projects in this workspace..."
                    />
                ) : projects.length === 0 ? (
                    <StatusMessage
                        title="No projects yet"
                        message="Create a project first, then add columns and tasks before linking."
                        action={
                            workspaceId ? (
                                <Link
                                    to={`/board/workspaces/${workspaceId}/projects/new`}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Project
                                </Link>
                            ) : null
                        }
                    />
                ) : columnsStatus === "loading" ? (
                    <StatusMessage
                        title="Loading columns"
                        message="Finding columns in the selected project..."
                    />
                ) : selectedProjectId && columns.length === 0 ? (
                    <StatusMessage
                        title="No columns in this project"
                        message="Create a column in this project before linking a task."
                        action={
                            workspaceId ? (
                                <Link
                                    to={`/board/workspaces/${workspaceId}/projects/${selectedProjectId}/columns/create`}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Column
                                </Link>
                            ) : null
                        }
                    />
                ) : tasksStatus === "loading" ? (
                    <StatusMessage
                        title="Loading tasks"
                        message="Finding tasks in the selected column..."
                    />
                ) : tasksError ? (
                    <StatusMessage title="Unable to load tasks" message={tasksError} />
                ) : selectedColumnId && tasks.length === 0 ? (
                    <StatusMessage
                        title="No tasks in this column"
                        message="Create a follow-up task in this column and attach it to this lead."
                        action={
                            workspaceId ? (
                                <Link
                                    to={`/board/workspaces/${workspaceId}/leads/${lead.id}/follow-up/${selectedProjectId}/${selectedColumnId}`}
                                    state={{
                                        projectName: selectedProject?.name,
                                        columnName: selectedColumn?.name,
                                    }}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Follow-up task
                                </Link>
                            ) : null
                        }
                    />
                ) : selectedColumnId && availableTasks.length === 0 ? (
                    <StatusMessage
                        title="All tasks are already linked"
                        message="Every task in this column is already attached to this lead. Create a new follow-up task if you need another action."
                        action={
                            workspaceId ? (
                                <Link
                                    to={`/board/workspaces/${workspaceId}/leads/${lead.id}/follow-up/${selectedProjectId}/${selectedColumnId}`}
                                    state={{
                                        projectName: selectedProject?.name,
                                        columnName: selectedColumn?.name,
                                    }}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Follow-up task
                                </Link>
                            ) : null
                        }
                    />
                ) : (
                    <div className="grid gap-3">
                        {availableTasks.map((task) => (
                            <TaskLinkCard
                                key={task.id}
                                task={task}
                                disabled={!workspaceId}
                                action={`/board/workspaces/${workspaceId}/leads/${lead.id}/${task.id}/linkTask`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
