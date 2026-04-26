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
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { ListByProjectLoader } from "../../../../features/column/loader/listByProject.loader";
import type { GetByIdLoader } from "../../../../features/workspace/loader/getById";
import type { ColumnType } from "../../../../../../api/prisma/generated/enums";
import { EyeIcon, PlusIcon } from "../../../../components/ui/Icons";

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
      className={[
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition",
        isDragging
          ? "scale-[1.01] opacity-80 shadow-md"
          : "hover:border-slate-300 hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-slate-900">
            {column.name}
          </h2>
        </div>

        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          className="inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-400 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Drag ${column.name}`}
          title="Drag to reorder"
        >
          ::
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
          {formatColumnType(column.type)}
        </span>

        <span className="shrink-0 text-slate-400">
          {new Date(column.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <Link
          to={`${column.id}`}
          className="group/detail-eye relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label={`View detail for ${column.name}`}
        >
          <EyeIcon className="h-4 w-4" />
          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition group-hover/detail-eye:opacity-100">
            detail
          </span>
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

  const role =
    workspaceData &&
    !("errorMessage" in workspaceData) &&
    !("formErrors" in workspaceData) &&
    !("fieldErrors" in workspaceData)
      ? workspaceData.myMembership.role
      : undefined;
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
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {loaderError}
      </div>
    );
  }

  const totalItems = hasColumnData(loaderData)
    ? loaderData.paginationMeta.totalItems
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Columns
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">{totalItems} columns</span>

          {canEditColumn && (
            <Link
              to="create"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 font-medium text-white transition hover:bg-slate-800"
            >
              <PlusIcon className="h-4 w-4" />
              Column
            </Link>
          )}
        </div>
      </div>

      {(actionError || isSaving) && (
        <div
          className={[
            "rounded-2xl px-4 py-3 text-sm",
            actionError
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-slate-200 bg-slate-50 text-slate-700",
          ].join(" ")}
        >
          {actionError ? actionError : "Saving new board order..."}
        </div>
      )}

      {columns.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">No columns yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create your first column to start organizing tasks.
          </p>

          {canEditColumn && (
            <div className="mt-6">
              <Link
                to="create"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <PlusIcon className="h-4 w-4" />
                Column
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((column) => column.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
    </div>
  );
}
