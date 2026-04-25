import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useFetcher,
  useLoaderData,
  useRouteLoaderData,
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
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { ListByProjectLoader } from "../../../../features/column/loader/listByProject.loader";
import type { GetByIdLoader } from "../../../../features/workspace/loader/getById";
import type { ColumnType } from "../../../../../../api/prisma/generated/enums";
import { ColumnNameSection } from "./Name.section";

type LoaderData = Awaited<ReturnType<typeof ListByProjectLoader>>;

type ColumnItem = {
  id: string;
  projectId: string;
  name: string;
  position: number;
  type: ColumnType;
  createdAt: string | Date;
};

function hasColumnData(
  data: LoaderData
): data is Extract<LoaderData, { data: ColumnItem[] }> {
  return !!data && typeof data === "object" && "data" in data && Array.isArray(data.data);
}

function hasErrorMessage(data: unknown): data is { errorMessage: string } {
  return !!data && typeof data === "object" && "errorMessage" in data;
}

function formatColumnType(type: ColumnType) {
  switch (type) {
    case "todo":
      return "To do";
    case "in_process":
      return "In process";
    case "done":
      return "Done";
    case "custom":
      return "Custom";
    default:
      return type;
  }
}

function normalizePositions(columns: ColumnItem[]) {
  return columns.map((column, index) => ({
    ...column,
    position: index + 1,
  }));
}

function SortableColumnCard({
  column,
  disabled,
}: {
  column: ColumnItem;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`w-[320px] shrink-0 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition ${isDragging ? "scale-[1.02] opacity-80 shadow-[0_20px_50px_rgba(0,0,0,0.14)]" : ""
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Column {column.position}
          </p>
          <ColumnNameSection
            columnId={column.id}
            initialName={column.name}
            canRenameColumn={!disabled}
            disabled={disabled}
          />
        </div>

        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          className="inline-flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-600 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Drag ${column.name}`}
          title="Drag to reorder"
        >
          ⋮⋮
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
          {formatColumnType(column.type)}
        </span>

        <span className="text-xs text-zinc-500">
          {new Date(column.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-8 text-center">
        <p className="text-sm font-medium text-zinc-700">Kanban lane</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Later, task cards for this column will appear here
        </p>

        <Link
          to={`${column.id}/tasks`}
          className="mt-4 inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Open tasks
        </Link>
      </div>
    </article>
  );
}

export function ListColumnPage() {
  const loaderData = useLoaderData<typeof ListByProjectLoader>();
  const workspaceData =
    useRouteLoaderData<typeof GetByIdLoader>("workspace-detail");
  const fetcher = useFetcher();

  const role = workspaceData?.myMembership?.role;
  const canEditColumn = role === "owner" || role === "admin";

  const initialColumns = useMemo<ColumnItem[]>(() => {
    if (!hasColumnData(loaderData)) return [];
    return [...loaderData.data].sort((a, b) => a.position - b.position);
  }, [loaderData]);

  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

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
  const actionError = hasErrorMessage(fetcher.data) ? fetcher.data.errorMessage : null;
  const loaderError =
    !hasColumnData(loaderData) && hasErrorMessage(loaderData)
      ? loaderData.errorMessage
      : null;

  function submitReorder(nextColumns: ColumnItem[]) {
    const formData = new FormData();
    formData.set(
      "items",
      JSON.stringify(
        nextColumns.map((column, index) => ({
          columnId: column.id,
          position: index + 1,
        }))
      )
    );

    fetcher.submit(formData, { method: "post" });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!canEditColumn || isSaving) return;

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = columns.findIndex((column) => column.id === active.id);
    const newIndex = columns.findIndex((column) => column.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = normalizePositions(arrayMove(columns, oldIndex, newIndex));

    setColumns(reordered);
    submitReorder(reordered);
  }

  if (loaderError) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loaderError}
        </div>
      </section>
    );
  }

  const totalItems = hasColumnData(loaderData)
    ? loaderData.paginationMeta.totalItems
    : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Project Board</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            Kanban columns
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Drag and drop to reorder columns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-2xl border border-zinc-200/70 bg-white/75 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Total
            </p>
            <p className="mt-1.5 text-sm font-medium leading-6 text-zinc-700">
              {totalItems}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/70 bg-white/75 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Permission
            </p>
            <p className="mt-1.5 text-sm font-medium leading-6 text-zinc-700">
              {canEditColumn ? "Can edit" : "View only"}
            </p>
          </div>

          {canEditColumn && (
            <Link
              to="create"
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              New column
            </Link>
          )}
        </div>
      </div>

      {(actionError || isSaving) && (
        <div
          className={`mb-4 rounded-2xl px-4 py-3 text-sm ${actionError
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-zinc-200 bg-zinc-50 text-zinc-700"
            }`}
        >
          {actionError ? actionError : "Saving new board order..."}
        </div>
      )}

      {columns.length === 0 ? (
        <div className="rounded-[28px] border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-zinc-900">No columns yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Create your first column to start organizing tasks.
          </p>

          {canEditColumn && (
            <div className="mt-6">
              <Link
                to="create"
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Create first column
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-4xl border border-zinc-200 bg-[#f8f8f7] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((column) => column.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex min-h-105 gap-4 overflow-x-auto pb-2">
                {columns.map((column) => (
                  <SortableColumnCard
                    key={column.id}
                    column={column}
                    disabled={!canEditColumn || isSaving}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </section>
  );
}
