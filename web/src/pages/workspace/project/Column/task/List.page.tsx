import { useEffect, useMemo, useRef, useState } from "react";
import {
    Link,
    Outlet,
    useFetcher,
    useLoaderData,
    useParams,
    useSearchParams,
} from "react-router-dom";

import {
    DndContext,
    PointerSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";

import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { ListByColumnLoader } from "../../../../../features/task/loader/listByColumn.loader";
import { ListMemberLoader } from "../../../../../features/workspace/loader/listMember";

type LoaderData = Awaited<ReturnType<typeof ListByColumnLoader>>;
type TaskListData = Extract<LoaderData, { data: unknown[] }>;
type TaskItem = TaskListData["data"][number];

type MemberLoaderData = Awaited<ReturnType<typeof ListMemberLoader>>;
type MemberListData = Extract<MemberLoaderData, { data: unknown[] }>;
type WorkspaceMemberItem = MemberListData["data"][number];

function isTaskListData(data: LoaderData): data is TaskListData {
    return (
        !!data &&
        typeof data === "object" &&
        "data" in data &&
        Array.isArray(data.data)
    );
}

function isMemberListData(
    data: MemberLoaderData | undefined
): data is MemberListData {
    return (
        !!data &&
        typeof data === "object" &&
        "data" in data &&
        Array.isArray(data.data)
    );
}

function hasErrorMessage(data: unknown): data is { errorMessage: string } {
    return (
        !!data &&
        typeof data === "object" &&
        "errorMessage" in data &&
        typeof (data as { errorMessage?: unknown }).errorMessage === "string"
    );
}

type Priority = NonNullable<TaskItem["priority"]>;
type PriorityFilter = Priority | "all";

const priorityMeta: Record<
    Priority,
    {
        label: string;
        className: string;
        activeClassName: string;
    }
> = {
    low: {
        label: "Low",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        activeClassName: "border-emerald-300 bg-emerald-100 text-emerald-800",
    },
    medium: {
        label: "Medium",
        className: "border-amber-200 bg-amber-50 text-amber-700",
        activeClassName: "border-amber-300 bg-amber-100 text-amber-800",
    },
    high: {
        label: "High",
        className: "border-red-200 bg-red-50 text-red-700",
        activeClassName: "border-red-300 bg-red-100 text-red-800",
    },
};

const priorityOptions = Object.keys(priorityMeta) as Priority[];

const priorityFilterOptions: Array<{
    value: PriorityFilter;
    label: string;
}> = [
    {
        value: "all",
        label: "All",
    },
    ...priorityOptions.map((priority) => ({
        value: priority,
        label: priorityMeta[priority].label,
    })),
];

function isPriority(value: string | null): value is Priority {
    return !!value && value in priorityMeta;
}

function PriorityBadge({ priority }: { priority: TaskItem["priority"] }) {
    const meta = priorityMeta[priority ?? "medium"];

    return (
        <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}

function normalizeTaskPositions(tasks: TaskItem[]) {
    return tasks.map((task, index) => ({
        ...task,
        position: index + 1,
    }));
}

function SortableTaskCard({
    task,
    disabled,
    workspaceId,
    isAssignOpen,
    onOpenAssign,
    onCloseAssign,
}: {
    task: TaskItem;
    disabled: boolean;
    workspaceId: string;
    isAssignOpen: boolean;
    onOpenAssign: () => void;
    onCloseAssign: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        disabled,
    });

    const membersFetcher = useFetcher<typeof ListMemberLoader>();
    const assignFetcher = useFetcher();

    const wasAssigningRef = useRef(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isLoadingMembers =
        membersFetcher.state !== "idle" && !membersFetcher.data;

    const membersError = hasErrorMessage(membersFetcher.data)
        ? membersFetcher.data.errorMessage
        : null;

    const assignError = hasErrorMessage(assignFetcher.data)
        ? assignFetcher.data.errorMessage
        : null;

    const isAssigning = assignFetcher.state !== "idle";

    useEffect(() => {
        if (!isAssignOpen) return;
        if (membersFetcher.data) return;

        membersFetcher.load(`/board/workspaces/${workspaceId}/members?limit=100`);
    }, [isAssignOpen, workspaceId, membersFetcher]);

    useEffect(() => {
        if (assignFetcher.state !== "idle") {
            wasAssigningRef.current = true;
            return;
        }

        if (!wasAssigningRef.current) return;

        wasAssigningRef.current = false;

        if (hasErrorMessage(assignFetcher.data)) return;

        onCloseAssign();
    }, [assignFetcher.state, assignFetcher.data, onCloseAssign]);

    return (
        <article
            ref={setNodeRef}
            style={style}
            className={[
                "group flex flex-col justify-between",
                "rounded-4xl border border-zinc-200 bg-white p-5 shadow-sm",
                "transition duration-200",
                "hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md",
                isAssignOpen
                    ? "min-h-120 overflow-visible"
                    : "aspect-square overflow-hidden",
                isDragging
                    ? "scale-[1.02] opacity-80 shadow-[0_20px_50px_rgba(0,0,0,0.14)]"
                    : "",
            ].join(" ")}
        >
            <div>
                <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-500">
                        #{task.position ?? "-"}
                    </span>

                    <PriorityBadge priority={task.priority} />
                </div>

                <h3 className="mt-5 line-clamp-2 text-base font-semibold leading-6 text-zinc-950">
                    {task.title}
                </h3>

                {task.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
                        {task.description}
                    </p>
                ) : (
                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                        No description added yet.
                    </p>
                )}

                {isAssignOpen && (
                    <div className="mt-5 rounded-3xl border border-zinc-200 bg-zinc-50/80 p-3">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-zinc-950">
                                    Assign member
                                </p>

                                <p className="mt-0.5 text-[11px] leading-4 text-zinc-500">
                                    Select one workspace member for this task.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onCloseAssign}
                                disabled={isAssigning}
                                className={[
                                    "shrink-0 rounded-full border border-zinc-200 bg-white",
                                    "px-3 py-1.5 text-[11px] font-medium text-zinc-500",
                                    "transition hover:bg-zinc-100 hover:text-zinc-900",
                                    isAssigning
                                        ? "cursor-not-allowed opacity-60"
                                        : "",
                                ].join(" ")}
                            >
                                Cancel
                            </button>
                        </div>

                        {isLoadingMembers && (
                            <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3">
                                <p className="text-xs text-zinc-500">
                                    Loading members...
                                </p>
                            </div>
                        )}

                        {membersError && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3">
                                <p className="text-xs text-red-700">
                                    {membersError}
                                </p>
                            </div>
                        )}

                        {isMemberListData(membersFetcher.data) &&
                            membersFetcher.data.data.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-3 py-4 text-center">
                                    <p className="text-xs font-medium text-zinc-700">
                                        No members found
                                    </p>

                                    <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                                        Invite members to this workspace first.
                                    </p>
                                </div>
                            )}

                        {isMemberListData(membersFetcher.data) &&
                            membersFetcher.data.data.length > 0 && (
                                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                                    {membersFetcher.data.data.map(
                                        (member: WorkspaceMemberItem) => {
                                            const avatarText = (
                                                member.user.name ||
                                                member.user.email ||
                                                "U"
                                            )
                                                .charAt(0)
                                                .toUpperCase();

                                            return (
                                                <assignFetcher.Form
                                                    key={member.user.id}
                                                    method="post"
                                                    action={`${task.id}/assign`}
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="userId"
                                                        value={member.user.id}
                                                    />

                                                    <button
                                                        type="submit"
                                                        disabled={isAssigning}
                                                        className={[
                                                            "flex w-full items-center justify-between gap-3",
                                                            "rounded-2xl border border-zinc-200 bg-white px-3 py-2.5",
                                                            "text-left transition",
                                                            "hover:border-zinc-300 hover:bg-zinc-100",
                                                            isAssigning
                                                                ? "cursor-not-allowed opacity-60"
                                                                : "",
                                                        ].join(" ")}
                                                    >
                                                        <span className="flex min-w-0 items-center gap-2.5">
                                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                                                                {avatarText}
                                                            </span>

                                                            <span className="min-w-0">
                                                                <span className="block truncate text-xs font-semibold text-zinc-950">
                                                                    {
                                                                        member
                                                                            .user
                                                                            .name
                                                                    }
                                                                </span>

                                                                <span className="block truncate text-[11px] text-zinc-500">
                                                                    {
                                                                        member
                                                                            .user
                                                                            .email
                                                                    }
                                                                </span>
                                                            </span>
                                                        </span>

                                                        <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium capitalize text-zinc-500">
                                                            {member.role}
                                                        </span>
                                                    </button>
                                                </assignFetcher.Form>
                                            );
                                        }
                                    )}
                                </div>
                            )}

                        {assignError && (
                            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2">
                                <p className="text-xs text-red-700">
                                    {assignError}
                                </p>
                            </div>
                        )}

                        {isAssigning && (
                            <p className="mt-3 text-xs text-zinc-500">
                                Assigning member...
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-5 border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                    <button
                        type="button"
                        onClick={isAssignOpen ? onCloseAssign : onOpenAssign}
                        disabled={isAssigning}
                        className={[
                            "inline-flex items-center justify-center rounded-full px-3.5 py-2",
                            "text-xs font-medium transition",
                            isAssignOpen
                                ? "border border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                : "bg-zinc-950 text-white shadow-sm hover:bg-zinc-800",
                            isAssigning
                                ? "cursor-not-allowed opacity-60"
                                : "",
                        ].join(" ")}
                    >
                        {isAssignOpen ? "Close assign" : "Assign"}
                    </button>

                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        disabled={disabled}
                        className={[
                            "inline-flex h-9 w-9 items-center justify-center rounded-2xl",
                            "border border-zinc-200 bg-zinc-50 text-zinc-500",
                            "transition active:cursor-grabbing",
                            disabled
                                ? "cursor-not-allowed opacity-40"
                                : "cursor-grab hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900",
                        ].join(" ")}
                        aria-label={`Drag ${task.title}`}
                        title={
                            disabled
                                ? "Switch to All to reorder tasks"
                                : "Drag to reorder"
                        }
                    >
                        ⋮⋮
                    </button>
                </div>
            </div>
        </article>
    );
}

export function ListTaskPage() {
    const data = useLoaderData<typeof ListByColumnLoader>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { workspaceId } = useParams();

    const fetcher = useFetcher();

    const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

    const initialTasks = useMemo<TaskItem[]>(() => {
        if (!isTaskListData(data)) return [];

        return [...data.data].sort((a, b) => {
            const positionA = a.position ?? Number.POSITIVE_INFINITY;
            const positionB = b.position ?? Number.POSITIVE_INFINITY;

            return positionA - positionB;
        });
    }, [data]);

    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const priorityFromUrl = searchParams.get("priority");
    const activePriority = isPriority(priorityFromUrl) ? priorityFromUrl : null;

    const visibleTasks = activePriority
        ? tasks.filter((task) => (task.priority ?? "medium") === activePriority)
        : tasks;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 180,
                tolerance: 6,
            },
        })
    );

    const isSaving = fetcher.state !== "idle";
    const actionError = hasErrorMessage(fetcher.data)
        ? fetcher.data.errorMessage
        : null;

    const canReorder = !activePriority && !isSaving && !assigningTaskId;

    if (!isTaskListData(data)) {
        return (
            <section className="rounded-3xl border border-red-100 bg-red-50 p-6">
                <p className="text-sm font-medium text-red-600">
                    Unable to load tasks.
                </p>
            </section>
        );
    }

    if (!workspaceId) {
        return (
            <section className="rounded-3xl border border-red-100 bg-red-50 p-6">
                <p className="text-sm font-medium text-red-600">
                    Missing workspace id.
                </p>
            </section>
        );
    }

    function handlePriorityFilter(priority: PriorityFilter) {
        const nextSearchParams = new URLSearchParams(searchParams);

        if (priority === "all") {
            nextSearchParams.delete("priority");
        } else {
            nextSearchParams.set("priority", priority);
        }

        setSearchParams(nextSearchParams);
    }

    function submitReorder(nextTasks: TaskItem[]) {
        const formData = new FormData();

        formData.set(
            "items",
            JSON.stringify(
                nextTasks.map((task, index) => ({
                    taskId: task.id,
                    position: index + 1,
                }))
            )
        );

        fetcher.submit(formData, {
            method: "post",
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        if (!canReorder) return;

        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = tasks.findIndex((task) => task.id === active.id);
        const newIndex = tasks.findIndex((task) => task.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = normalizeTaskPositions(
            arrayMove(tasks, oldIndex, newIndex)
        );

        setTasks(reordered);
        submitReorder(reordered);
    }

    const taskCountText = activePriority
        ? `${visibleTasks.length} ${priorityMeta[
              activePriority
          ].label.toLowerCase()} priority task${
              visibleTasks.length !== 1 ? "s" : ""
          }`
        : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} in this column`;

    return (
        <section className="space-y-5">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                            Tasks
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            {taskCountText}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {priorityFilterOptions.map((option) => {
                                const isActive =
                                    option.value === "all"
                                        ? activePriority === null
                                        : activePriority === option.value;

                                const activeClassName =
                                    option.value === "all"
                                        ? "border-zinc-900 bg-zinc-950 text-white"
                                        : priorityMeta[option.value]
                                              .activeClassName;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            handlePriorityFilter(option.value)
                                        }
                                        className={[
                                            "inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-medium transition",
                                            "hover:-translate-y-0.5 hover:shadow-sm",
                                            isActive
                                                ? activeClassName
                                                : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50",
                                        ].join(" ")}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>

                        {activePriority && (
                            <p className="mt-3 text-xs text-zinc-400">
                                Reordering is available in All view only.
                            </p>
                        )}

                        {assigningTaskId && (
                            <p className="mt-3 text-xs text-zinc-400">
                                Reordering is paused while assigning a member.
                            </p>
                        )}
                    </div>

                    <Link
                        to="create"
                        className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800"
                    >
                        + Create new task
                    </Link>
                </div>
            </div>

            <Outlet />

            {(actionError || isSaving) && (
                <div
                    className={[
                        "rounded-2xl px-4 py-3 text-sm",
                        actionError
                            ? "border border-red-200 bg-red-50 text-red-700"
                            : "border border-zinc-200 bg-zinc-50 text-zinc-700",
                    ].join(" ")}
                >
                    {actionError ? actionError : "Saving new task order..."}
                </div>
            )}

            {visibleTasks.length === 0 ? (
                <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/70 p-8 text-center">
                    <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl font-semibold text-zinc-500">
                            +
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-zinc-950">
                            {activePriority
                                ? `No ${priorityMeta[
                                      activePriority
                                  ].label.toLowerCase()} priority tasks`
                                : "No tasks yet"}
                        </h3>

                        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                            {activePriority
                                ? "There are no tasks with this priority in the current column."
                                : "Create the first task for this column and start organizing your work."}
                        </p>

                        <Link
                            to="create"
                            className="mt-5 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800"
                        >
                            + Create new task
                        </Link>
                    </div>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={visibleTasks.map((task) => task.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {visibleTasks.map((task: TaskItem) => (
                                <SortableTaskCard
                                    key={task.id}
                                    task={task}
                                    workspaceId={workspaceId}
                                    disabled={!canReorder}
                                    isAssignOpen={assigningTaskId === task.id}
                                    onOpenAssign={() =>
                                        setAssigningTaskId(task.id)
                                    }
                                    onCloseAssign={() =>
                                        setAssigningTaskId(null)
                                    }
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </section>
    );
}