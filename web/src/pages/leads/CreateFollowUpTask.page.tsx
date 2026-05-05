import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
    Link,
    useFetcher,
    useLocation,
    useNavigate,
    useOutletContext,
    useParams,
} from "react-router-dom";
import type { SafeLeadDetailType } from "../../../../api/src/modules/lead/lead.schemas";
import type { ActionError } from "../../features/type";
import { ArrowLeftIcon, CheckIcon, XIcon } from "../../components/ui/Icons";

type LeadDetailOutletContext = {
    lead: SafeLeadDetailType;
    canEditLead: boolean;
};

type FollowUpFormState = {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    dueDate: string;
};

const priorityMeta: Record<
    FollowUpFormState["priority"],
    {
        label: string;
        className: string;
    }
> = {
    low: {
        label: "Low",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    medium: {
        label: "Medium",
        className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    high: {
        label: "High",
        className: "border-red-200 bg-red-50 text-red-700",
    },
};

const labelClassName = "text-[11px] font-semibold uppercase text-slate-400";

function isActionError(data: unknown): data is ActionError {
    return (
        !!data &&
        typeof data === "object" &&
        ("fieldErrors" in data || "formErrors" in data || "errorMessage" in data)
    );
}

function getFieldError(data: unknown, field: string) {
    return isActionError(data) ? data.fieldErrors?.[field]?.[0] : undefined;
}

function getInputClassName(error?: string) {
    return [
        "mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition",
        "placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        error
            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
    ].join(" ");
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
            {message}
        </p>
    );
}

export function CreateFollowUpTaskPage() {
    const { lead, canEditLead } = useOutletContext<LeadDetailOutletContext>();
    const { workspaceId, projectId, columnId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const fetcher = useFetcher<unknown>();
    const initialTitle = useMemo(
        () => `Follow up with ${lead.name}`.slice(0, 100),
        [lead.name]
    );
    const [formState, setFormState] = useState<FollowUpFormState>({
        title: initialTitle,
        description: "",
        priority: "medium",
        dueDate: "",
    });

    const isSubmitting = fetcher.state !== "idle";
    const titleError = getFieldError(fetcher.data, "title");
    const descriptionError = getFieldError(fetcher.data, "description");
    const priorityError = getFieldError(fetcher.data, "priority");
    const dueDateError = getFieldError(fetcher.data, "dueDate");
    const formError = isActionError(fetcher.data)
        ? fetcher.data.errorMessage || fetcher.data.formErrors?.[0]
        : undefined;
    const selectedPriority = priorityMeta[formState.priority];
    const destinationState =
        location.state && typeof location.state === "object"
            ? (location.state as {
                  projectName?: string;
                  columnName?: string;
              })
            : {};
    const destinationProjectName = destinationState.projectName || "Selected project";
    const destinationColumnName = destinationState.columnName || "Selected column";

    useEffect(() => {
        if (fetcher.state !== "idle") return;
        if (!fetcher.data || isActionError(fetcher.data)) return;

        navigate(`/board/workspaces/${workspaceId}/leads/${lead.id}`);
    }, [fetcher.data, fetcher.state, lead.id, navigate, workspaceId]);

    function updateField(
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = event.currentTarget;

        setFormState((current) => ({
            ...current,
            [name]: value,
        }));
    }

    if (!canEditLead) {
        return (
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                    <h3 className="text-sm font-semibold text-slate-950">
                        You cannot create follow-up tasks
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Only the lead owner or workspace managers can create follow-up tasks for this lead.
                    </p>
                </div>
            </section>
        );
    }

    if (!workspaceId || !projectId || !columnId) {
        return (
            <section className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-red-700">
                    Missing project or column context.
                </p>
            </section>
        );
    }

    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div>
                    <p className="text-sm font-semibold text-slate-950">
                        Create follow-up task
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Create a task in the selected column and link it to {lead.name}.
                    </p>
                </div>

                <Link
                    to={`/board/workspaces/${workspaceId}/leads/${lead.id}/linkTask`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                    aria-label="Close follow-up task"
                    title="Close"
                >
                    <XIcon className="h-4 w-4" />
                </Link>
            </div>

            <fetcher.Form method="post" className="space-y-5 p-5 sm:p-6">
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Destination</span>
                    {" - "}
                    {destinationProjectName} / {destinationColumnName}
                </div>

                {formError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {formError}
                    </div>
                ) : null}

                <div>
                    <label htmlFor="follow-title" className={labelClassName}>
                        Title
                    </label>
                    <input
                        id="follow-title"
                        name="title"
                        type="text"
                        value={formState.title}
                        onChange={updateField}
                        disabled={isSubmitting}
                        required
                        minLength={5}
                        maxLength={100}
                        placeholder="Follow up with customer"
                        className={getInputClassName(titleError)}
                    />
                    <FieldError message={titleError} />
                </div>

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <label htmlFor="follow-description" className={labelClassName}>
                            Description
                        </label>
                        <span className="text-xs text-slate-400">
                            {formState.description.length}/100
                        </span>
                    </div>
                    <textarea
                        id="follow-description"
                        name="description"
                        value={formState.description}
                        onChange={updateField}
                        disabled={isSubmitting}
                        minLength={10}
                        maxLength={100}
                        rows={4}
                        placeholder="Add context for the next follow-up..."
                        className={[
                            "mt-2 w-full resize-none rounded-lg border bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition",
                            "placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                            descriptionError
                                ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
                        ].join(" ")}
                    />
                    <FieldError message={descriptionError} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="follow-priority" className={labelClassName}>
                            Priority
                        </label>
                        <select
                            id="follow-priority"
                            name="priority"
                            value={formState.priority}
                            onChange={updateField}
                            disabled={isSubmitting}
                            className={getInputClassName(priorityError)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <FieldError message={priorityError} />
                    </div>

                    <div>
                        <label htmlFor="follow-due-date" className={labelClassName}>
                            Due date
                        </label>
                        <input
                            id="follow-due-date"
                            name="dueDate"
                            type="date"
                            value={formState.dueDate}
                            onChange={updateField}
                            disabled={isSubmitting}
                            className={getInputClassName(dueDateError)}
                        />
                        <FieldError message={dueDateError} />
                    </div>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                        Preview
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-slate-950">
                                {formState.title || "Untitled follow-up"}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                                {formState.description || "No description yet."}
                            </p>
                        </div>
                        <span
                            className={`w-fit shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${selectedPriority.className}`}
                        >
                            {selectedPriority.label}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
                    <Link
                        to={`/board/workspaces/${workspaceId}/leads/${lead.id}/linkTask`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <CheckIcon className="h-4 w-4" />
                        {isSubmitting ? "Creating..." : "Create and link"}
                    </button>
                </div>
            </fetcher.Form>
        </section>
    );
}
