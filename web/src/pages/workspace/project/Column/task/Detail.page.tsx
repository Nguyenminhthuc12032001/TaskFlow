import { useState } from "react";
import {
    Link,
    Outlet,
    useFetcher,
    useLoaderData,
    useLocation,
    useNavigate,
    useRouteLoaderData,
} from "react-router-dom";
import type { SafeTaskDetail } from "../../../../../../../api/src/modules/task/task.schemas";
import { useAuth } from "../../../../../features/auth/auth.store";
import type { GetTaskByIdLoader } from "../../../../../features/task/loader/getById.loader";
import type { GetByIdLoader } from "../../../../../features/workspace/loader/getById";
import type { ActionError } from "../../../../../features/type";
import {
    ArrowLeftIcon,
    CheckIcon,
    EditIcon,
    MessageCircleIcon,
    UsersIcon,
    XIcon,
} from "../../../../../components/ui/Icons";

type UpdateTaskActionData = ActionError | undefined;

const priorityClassName = {
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    high: "border-red-200 bg-red-50 text-red-700",
};

const labelClassName =
    "text-[11px] font-semibold uppercase tracking-wide text-zinc-400";

function isActionError(data: UpdateTaskActionData): data is ActionError {
    return (
        !!data &&
        typeof data === "object" &&
        ("fieldErrors" in data || "formErrors" in data || "errorMessage" in data)
    );
}

function toDateInputValue(value: Date | string | undefined) {
    if (!value) return "";

    return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value: Date | string | undefined) {
    if (!value) return "No due date";

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    }).format(new Date(value));
}

function getNavItemClassName(isActive: boolean) {
    return [
        "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition",
        isActive
            ? "bg-zinc-950 text-white shadow-sm"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
    ].join(" ");
}

function TaskDetailContent({
    task,
    canEditTask,
}: {
    task: SafeTaskDetail;
    canEditTask: boolean;
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const fetcher = useFetcher<UpdateTaskActionData>();

    const [isAssigneesOpen, setIsAssigneesOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? "");
    const [priorityValue, setPriorityValue] = useState(task.priority);
    const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));

    const fetcherData = fetcher.data;
    const isSubmitting = fetcher.state === "submitting";
    const assigneeCount = task.assignees.length;
    const isAssignedToMe = task.assignees.some(
        (assignee) => assignee.userId === auth.user?.id
    );
    const isCommentsRoute = location.pathname.includes("/comment");

    const titleError = isActionError(fetcherData)
        ? fetcherData.fieldErrors?.title?.[0]
        : undefined;
    const descriptionError = isActionError(fetcherData)
        ? fetcherData.fieldErrors?.description?.[0]
        : undefined;
    const dueDateError = isActionError(fetcherData)
        ? fetcherData.fieldErrors?.dueDate?.[0]
        : undefined;
    const priorityError = isActionError(fetcherData)
        ? fetcherData.fieldErrors?.priority?.[0]
        : undefined;
    const formError = isActionError(fetcherData)
        ? fetcherData.formErrors?.[0]
        : undefined;
    const errorMessage = isActionError(fetcherData)
        ? fetcherData.errorMessage
        : undefined;

    function handleCancelEdit() {
        setTitle(task.title);
        setDescription(task.description ?? "");
        setPriorityValue(task.priority);
        setDueDate(toDateInputValue(task.dueDate));
        setIsEditing(false);
    }

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200/80 bg-white shadow-sm">
            <fetcher.Form method="post">
                <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-500">
                                    Position #{task.position ?? "-"}
                                </span>

                                <span
                                    className={[
                                        "rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                                        priorityClassName[task.priority],
                                    ].join(" ")}
                                >
                                    {task.priority}
                                </span>

                                {isAssignedToMe && (
                                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                        Assigned to you
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex items-start gap-3">
                                {isEditing ? (
                                    <div className="min-w-0 flex-1">
                                        <input
                                            type="text"
                                            name="title"
                                            value={title}
                                            onChange={(event) => setTitle(event.target.value)}
                                            aria-invalid={!!titleError}
                                            aria-describedby={
                                                titleError ? "task-title-error" : undefined
                                            }
                                            className={[
                                                "w-full rounded-lg border px-4 py-2 text-2xl font-semibold text-zinc-950 outline-none transition",
                                                titleError
                                                    ? "border-red-300 bg-white shadow-sm focus:border-red-400 focus:ring-4 focus:ring-red-50"
                                                    : "border-zinc-200 bg-white shadow-sm focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100",
                                            ].join(" ")}
                                        />

                                        {titleError && (
                                            <p id="task-title-error" className="mt-2 text-sm text-red-600">
                                                {titleError}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <h2 className="min-w-0 flex-1 text-2xl font-semibold text-zinc-950">
                                        {task.title}
                                    </h2>
                                )}

                                {canEditTask && !isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                                        aria-label="Edit task"
                                        title="Edit task"
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <p className="mt-2 text-sm text-zinc-500">
                                Created {formatDate(task.createdAt)} / Updated{" "}
                                {formatDate(task.updatedAt)}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsAssigneesOpen((isOpen) => !isOpen)}
                                className={[
                                    "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
                                    isAssigneesOpen
                                        ? "border-zinc-950 bg-zinc-950 text-white shadow-sm hover:bg-zinc-800"
                                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950",
                                ].join(" ")}
                            >
                                <UsersIcon className="h-4 w-4" />
                                Assignees ({assigneeCount})
                            </button>

                            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                                <Link
                                    to=".."
                                    relative="path"
                                    className={getNavItemClassName(!isCommentsRoute)}
                                >
                                    Tasks
                                </Link>

                                <Link
                                    to="comment"
                                    className={getNavItemClassName(isCommentsRoute)}
                                >
                                    <MessageCircleIcon className="h-4 w-4" />
                                    Comments
                                </Link>
                            </div>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="mt-6 space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="task-priority" className={labelClassName}>
                                        Priority
                                    </label>

                                    <select
                                        id="task-priority"
                                        name="priority"
                                        value={priorityValue}
                                        onChange={(event) =>
                                            setPriorityValue(event.target.value as SafeTaskDetail["priority"])
                                        }
                                        aria-invalid={!!priorityError}
                                        className={[
                                            "mt-2 h-11 w-full rounded-lg border px-3 text-sm text-zinc-950 outline-none transition",
                                            priorityError
                                                ? "border-red-300 bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50"
                                                : "border-zinc-200 bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100",
                                        ].join(" ")}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>

                                    {priorityError && (
                                        <p className="mt-2 text-sm text-red-600">{priorityError}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="task-due-date" className={labelClassName}>
                                        Due date
                                    </label>

                                    <input
                                        id="task-due-date"
                                        type="date"
                                        name="dueDate"
                                        value={dueDate}
                                        onChange={(event) => setDueDate(event.target.value)}
                                        aria-invalid={!!dueDateError}
                                        className={[
                                            "mt-2 h-11 w-full rounded-lg border px-3 text-sm text-zinc-950 outline-none transition",
                                            dueDateError
                                                ? "border-red-300 bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50"
                                                : "border-zinc-200 bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100",
                                        ].join(" ")}
                                    />

                                    {dueDateError && (
                                        <p className="mt-2 text-sm text-red-600">{dueDateError}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="task-description" className={labelClassName}>
                                    Description
                                </label>

                                <textarea
                                    id="task-description"
                                    name="description"
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={5}
                                    aria-invalid={!!descriptionError}
                                    className={[
                                        "mt-2 w-full resize-none rounded-lg border px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition",
                                        descriptionError
                                            ? "border-red-300 bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50"
                                            : "border-zinc-200 bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100",
                                    ].join(" ")}
                                    placeholder="No description added yet."
                                />

                                {descriptionError && (
                                    <p className="mt-2 text-sm text-red-600">{descriptionError}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                            <div className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="border-b border-zinc-100 pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                                        <p className={labelClassName}>Priority</p>
                                        <p className="mt-2 text-sm font-semibold capitalize text-zinc-950">
                                            {task.priority}
                                        </p>
                                    </div>

                                    <div>
                                        <p className={labelClassName}>Due date</p>
                                        <p className="mt-2 text-sm font-semibold text-zinc-950">
                                            {formatDate(task.dueDate)}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-zinc-100 pt-5">
                                    <p className={labelClassName}>Description</p>
                                    <p className="mt-3 min-h-20 whitespace-pre-wrap break-words rounded-lg bg-zinc-50/80 p-4 text-sm leading-6 text-zinc-700 ring-1 ring-inset ring-zinc-100">
                                        {task.description || "No description added yet."}
                                    </p>
                                </div>
                            </div>

                            <aside className="border-t border-zinc-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                                <dl className="space-y-4">
                                    <div>
                                        <dt className={labelClassName}>Created</dt>
                                        <dd className="mt-1 text-sm font-medium text-zinc-800">
                                            {formatDate(task.createdAt)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className={labelClassName}>Updated</dt>
                                        <dd className="mt-1 text-sm font-medium text-zinc-800">
                                            {formatDate(task.updatedAt)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className={labelClassName}>Task ID</dt>
                                        <dd className="mt-1 break-all font-mono text-xs leading-5 text-zinc-500">
                                            {task.id}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className={labelClassName}>Created by</dt>
                                        <dd className="mt-1 break-all font-mono text-xs leading-5 text-zinc-500">
                                            {task.createdBy}
                                        </dd>
                                    </div>
                                </dl>
                            </aside>
                        </div>
                    )}

                    {isEditing && (
                        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:opacity-60"
                                aria-label={isSubmitting ? "Saving task" : "Save task"}
                                title={isSubmitting ? "Saving..." : "Save"}
                            >
                                <CheckIcon className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={isSubmitting}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                                aria-label="Cancel task edit"
                                title="Cancel"
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {(formError || errorMessage) && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError || errorMessage}
                        </div>
                    )}
                </div>
            </fetcher.Form>

            {isAssigneesOpen && (
                <div className="border-t border-zinc-200 bg-zinc-50/70 p-5 sm:p-6">
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-zinc-950">Assignees</p>
                            <p className="text-xs text-zinc-500">
                                {assigneeCount} member{assigneeCount !== 1 ? "s" : ""} assigned to this task
                            </p>
                        </div>
                    </div>

                    {assigneeCount === 0 ? (
                        <div className="rounded-lg border border-dashed border-zinc-300 bg-white/80 px-4 py-6 text-center">
                            <p className="text-sm font-medium text-zinc-700">
                                No assignees yet
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {task.assignees.map((assignee) => {
                                const avatarText = (
                                    assignee.user.name ||
                                    assignee.user.email ||
                                    "U"
                                )
                                    .charAt(0)
                                    .toUpperCase();

                                return (
                                    <div
                                        key={assignee.userId}
                                        className="flex min-w-0 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-3"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                                            {avatarText}
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-zinc-950">
                                                {assignee.user.name}
                                            </span>
                                            <span className="block truncate text-xs text-zinc-500">
                                                {assignee.user.email}
                                            </span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

export function TaskDetailPage() {
    const data = useLoaderData<typeof GetTaskByIdLoader>();
    const navigate = useNavigate();
    const workspaceData = useRouteLoaderData<typeof GetByIdLoader>("workspace-detail");
    const role = workspaceData?.myMembership?.role;
    const canEditTask =
        !!workspaceData &&
        !("errorMessage" in workspaceData) &&
        !("formErrors" in workspaceData) &&
        !("fieldErrors" in workspaceData) &&
        (role === "owner" || role === "admin");

    if (!data) {
        return (
            <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">
                    No task data found.
                </p>
            </section>
        );
    }

    if ("errorMessage" in data || "formErrors" in data || "fieldErrors" in data) {
        const message =
            ("errorMessage" in data && data.errorMessage) ||
            ("formErrors" in data && data.formErrors?.[0]) ||
            "Something went wrong while loading this task.";

        return (
            <section className="rounded-lg border border-red-100 bg-red-50 p-6 shadow-sm">
                <p className="text-sm font-semibold text-red-700">
                    Failed to load task
                </p>

                <p className="mt-2 text-sm text-red-600">{message}</p>

                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mt-5 inline-flex h-10 items-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                    Go back
                </button>
            </section>
        );
    }

    return (
        <div className="space-y-5">
            <TaskDetailContent task={data} canEditTask={canEditTask} />
            <Outlet />
        </div>
    );
}
