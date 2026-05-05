import { useEffect, useState, type ChangeEvent } from "react";
import {
    Link,
    Outlet,
    useFetcher,
    useLoaderData,
    useNavigate,
    useRouteLoaderData,
} from "react-router-dom";
import PhoneInput, { type Value as PhoneNumberValue } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import vi from "react-phone-number-input/locale/vi";
import type { SafeLeadDetailType } from "../../../../api/src/modules/lead/lead.schemas";
import type { SafeMemberResponse } from "../../../../api/src/modules/workspace/workspace.schemas";
import { ArrowLeftIcon, CheckIcon, EditIcon, EyeIcon, PlusIcon, XIcon } from "../../components/ui/Icons";
import type { GetByIdLoader } from "../../features/workspace/loader/getById";
import type { GetLeadByIdLoader } from "../../features/lead/loader/getById.loader";
import type { ActionError } from "../../features/type";
import { useAuth } from "../../features/auth/auth.store";

type LeadStageValue = SafeLeadDetailType["stage"];
type LeadTask = SafeLeadDetailType["taskLinks"][number];

const stageMeta: Record<
    LeadStageValue,
    {
        label: string;
        description: string;
        className: string;
        dotClassName: string;
    }
> = {
    new: {
        label: "New",
        description: "Freshly captured",
        className: "border-sky-200 bg-sky-50 text-sky-700",
        dotClassName: "bg-sky-500",
    },
    contacted: {
        label: "Contacted",
        description: "First touch completed",
        className: "border-indigo-200 bg-indigo-50 text-indigo-700",
        dotClassName: "bg-indigo-500",
    },
    qualified: {
        label: "Qualified",
        description: "Fit and intent are clear",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dotClassName: "bg-emerald-500",
    },
    won: {
        label: "Won",
        description: "Converted successfully",
        className: "border-lime-200 bg-lime-50 text-lime-700",
        dotClassName: "bg-lime-500",
    },
    lost: {
        label: "Lost",
        description: "Closed without conversion",
        className: "border-rose-200 bg-rose-50 text-rose-700",
        dotClassName: "bg-rose-500",
    },
};

const stageValues = Object.keys(stageMeta) as LeadStageValue[];

const priorityClassName: Record<LeadTask["priority"], string> = {
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    high: "border-red-200 bg-red-50 text-red-700",
};

const labelClassName = "text-[11px] font-semibold uppercase text-slate-400";

function isActionError(data: unknown): data is ActionError {
    return (
        !!data &&
        typeof data === "object" &&
        ("fieldErrors" in data || "formErrors" in data || "errorMessage" in data)
    );
}

function getErrorMessage(data: unknown) {
    if (isActionError(data)) {
        return data.errorMessage || data.formErrors?.[0] || "Something went wrong.";
    }

    return "Something went wrong while loading this lead.";
}

function formatDate(value: Date | string | undefined) {
    if (!value) return "Not set";

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function formatShortDate(value: Date | string | undefined) {
    if (!value) return "No due date";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function getInitials(name: string) {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return initials || "LD";
}

function getContactText(lead: SafeLeadDetailType) {
    const contact = [lead.email, lead.phone].filter(Boolean);

    return contact.length > 0 ? contact.join(" / ") : "No contact yet";
}

function getFreshnessText(value: Date | string) {
    const updated = new Date(value).getTime();
    const days = Math.max(0, Math.floor((Date.now() - updated) / 86_400_000));

    if (days === 0) return "Updated today";
    if (days === 1) return "Updated yesterday";

    return `Updated ${days} days ago`;
}

function getFieldError(data: unknown, field: string) {
    return isActionError(data) ? data.fieldErrors?.[field]?.[0] : undefined;
}

function StageBadge({ stage }: { stage: LeadStageValue }) {
    const meta = stageMeta[stage];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`} />
            {meta.label}
        </span>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
            {message}
        </p>
    );
}

function LeadHeader({
    lead,
}: {
    lead: SafeLeadDetailType;
}) {
    return (
        <header className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6">
                <div className="flex min-w-0 gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                        {getInitials(lead.name)}
                    </span>

                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                Lead detail
                            </span>
                            <StageBadge stage={lead.stage} />
                        </div>

                        <h1 className="break-words text-2xl font-semibold text-slate-950 sm:text-3xl">
                            {lead.name}
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            {getContactText(lead)}
                        </p>
                    </div>
                </div>
            </div>

            <dl className="grid divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="min-w-0 px-5 py-4 sm:px-6">
                    <dt className={labelClassName}>Source</dt>
                    <dd className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {lead.source || "Not set"}
                    </dd>
                </div>

                <div className="min-w-0 px-5 py-4 sm:px-6">
                    <dt className={labelClassName}>Created</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(lead.createdAt)}
                    </dd>
                </div>

                <div className="min-w-0 px-5 py-4 sm:px-6">
                    <dt className={labelClassName}>Updated</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(lead.updatedAt)}
                    </dd>
                </div>
            </dl>
        </header>
    );
}

function LeadProfileCard({
    lead,
    canEditLead,
    isEditing,
    onEdit,
    onCancel,
}: {
    lead: SafeLeadDetailType;
    canEditLead: boolean;
    isEditing: boolean;
    onEdit: () => void;
    onCancel: () => void;
}) {
    const fetcher = useFetcher<unknown>();
    const [formState, setFormState] = useState({
        name: lead.name,
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        source: lead.source ?? "",
        note: lead.note,
    });

    const isSubmitting = fetcher.state === "submitting";
    const nameError = getFieldError(fetcher.data, "name");
    const emailError = getFieldError(fetcher.data, "email");
    const phoneError = getFieldError(fetcher.data, "phone");
    const sourceError = getFieldError(fetcher.data, "source");
    const noteError = getFieldError(fetcher.data, "note");
    const formError = isActionError(fetcher.data)
        ? fetcher.data.errorMessage || fetcher.data.formErrors?.[0]
        : undefined;

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data && !isActionError(fetcher.data)) {
            onCancel();
        }
    }, [fetcher.data, fetcher.state, onCancel]);

    function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = event.currentTarget;

        setFormState((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function updatePhone(phone?: PhoneNumberValue) {
        setFormState((current) => ({
            ...current,
            phone: phone ?? "",
        }));
    }

    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <p className="text-sm font-semibold text-slate-950">Profile</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Contact, source, and working note.
                    </p>
                </div>

                {canEditLead && !isEditing ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        aria-label="Edit lead profile"
                        title="Edit"
                    >
                        <EditIcon className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            {isEditing ? (
                <fetcher.Form method="post" action="update" className="space-y-5 px-5 py-5 sm:px-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="lead-name" className={labelClassName}>
                                Name
                            </label>
                            <input
                                id="lead-name"
                                name="name"
                                type="text"
                                value={formState.name}
                                onChange={updateField}
                                disabled={isSubmitting}
                                required
                                minLength={5}
                                maxLength={100}
                                autoComplete="name"
                                placeholder="Example: Nguyen Minh Anh"
                                className={[
                                    "mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                                    nameError
                                        ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                        : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
                                ].join(" ")}
                            />
                            <FieldError message={nameError} />
                        </div>

                        <div>
                            <label htmlFor="lead-email" className={labelClassName}>
                                Email
                            </label>
                            <input
                                id="lead-email"
                                name="email"
                                type="email"
                                value={formState.email}
                                onChange={updateField}
                                disabled={isSubmitting}
                                maxLength={120}
                                autoComplete="email"
                                placeholder="lead@example.com"
                                className={[
                                    "mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                                    emailError
                                        ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                        : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
                                ].join(" ")}
                            />
                            <FieldError message={emailError} />
                        </div>

                        <div>
                            <label htmlFor="lead-phone" className={labelClassName}>
                                Phone
                            </label>
                            <PhoneInput
                                id="lead-phone"
                                flags={flags}
                                labels={vi}
                                defaultCountry="VN"
                                value={formState.phone}
                                onChange={updatePhone}
                                disabled={isSubmitting}
                                placeholder="084 227 6949"
                                autoComplete="tel"
                                className={[
                                    "taskflow-phone-input mt-2",
                                    phoneError ? "taskflow-phone-input--error" : "",
                                    isSubmitting ? "taskflow-phone-input--disabled" : "",
                                ].join(" ")}
                            />
                            <input type="hidden" name="phone" value={formState.phone} />
                            <FieldError message={phoneError} />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="lead-source" className={labelClassName}>
                                Source
                            </label>
                            <input
                                id="lead-source"
                                name="source"
                                value={formState.source}
                                onChange={updateField}
                                disabled={isSubmitting}
                                minLength={10}
                                maxLength={100}
                                autoComplete="off"
                                placeholder="Website contact form"
                                className={[
                                    "mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                                    sourceError
                                        ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                        : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
                                ].join(" ")}
                            />
                            <FieldError message={sourceError} />
                        </div>

                        <div className="sm:col-span-2">
                            <div className="flex items-center justify-between gap-3">
                                <label htmlFor="lead-note" className={labelClassName}>
                                    Note
                                </label>
                                <span className="text-xs text-slate-400">
                                    {formState.note.length}/200
                                </span>
                            </div>
                            <textarea
                                id="lead-note"
                                name="note"
                                value={formState.note}
                                onChange={updateField}
                                disabled={isSubmitting}
                                required
                                minLength={5}
                                maxLength={200}
                                placeholder="Add context, intent, or the next follow-up..."
                                rows={5}
                                className={[
                                    "mt-2 w-full resize-none rounded-lg border bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                                    noteError
                                        ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                        : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
                                ].join(" ")}
                            />
                            <FieldError message={noteError} />
                        </div>
                    </div>

                    {formError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={isSubmitting ? "Saving lead" : "Save lead"}
                            title={isSubmitting ? "Saving..." : "Save"}
                        >
                            <CheckIcon className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Cancel lead edit"
                            title="Cancel"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                </fetcher.Form>
            ) : (
                <div className="space-y-5 px-5 py-5 sm:px-6">
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                            <dt className={labelClassName}>Email</dt>
                            <dd className="mt-1 truncate text-sm font-semibold text-slate-800">
                                {lead.email ? (
                                    <a className="hover:text-slate-950" href={`mailto:${lead.email}`}>
                                        {lead.email}
                                    </a>
                                ) : (
                                    "Not set"
                                )}
                            </dd>
                        </div>

                        <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                            <dt className={labelClassName}>Phone</dt>
                            <dd className="mt-1 truncate text-sm font-semibold text-slate-800">
                                {lead.phone ? (
                                    <a className="hover:text-slate-950" href={`tel:${lead.phone}`}>
                                        {lead.phone}
                                    </a>
                                ) : (
                                    "Not set"
                                )}
                            </dd>
                        </div>

                        <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 sm:col-span-2">
                            <dt className={labelClassName}>Source</dt>
                            <dd className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">
                                {lead.source || "Not set"}
                            </dd>
                        </div>
                    </dl>

                    <div>
                        <p className={labelClassName}>Working note</p>
                        <p className="mt-2 min-h-28 whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                            {lead.note}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

function StageControl({
    lead,
    canEditLead,
}: {
    lead: SafeLeadDetailType;
    canEditLead: boolean;
}) {
    const fetcher = useFetcher<unknown>();
    const [isEditingStage, setIsEditingStage] = useState(false);
    const meta = stageMeta[lead.stage];
    const stageError = isActionError(fetcher.data)
        ? fetcher.data.errorMessage || fetcher.data.formErrors?.[0] || fetcher.data.fieldErrors?.stage?.[0]
        : undefined;
    const isSubmitting = fetcher.state === "submitting";

    function handleStageChange(event: ChangeEvent<HTMLSelectElement>) {
        if (event.currentTarget.value === lead.stage) return;

        setIsEditingStage(false);
        event.currentTarget.form?.requestSubmit();
    }

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-950">Stage</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Current lead status.
                    </p>
                </div>
                {canEditLead && !isEditingStage ? (
                    <button
                        type="button"
                        onClick={() => setIsEditingStage(true)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        aria-label="Edit lead stage"
                        title="Edit stage"
                    >
                        <EditIcon className="h-4 w-4" />
                    </button>
                ) : (
                    <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dotClassName}`} />
                )}
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <StageBadge stage={lead.stage} />
                        <p className="mt-3 text-sm font-semibold text-slate-950">
                            {meta.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            {meta.description}
                        </p>
                    </div>
                </div>
            </div>

            {canEditLead && isEditingStage ? (
                <fetcher.Form method="post" action="updateStage" className="mt-4">
                    <div className="flex items-end gap-2">
                        <div className="min-w-0 flex-1">
                            <label htmlFor="lead-stage" className={labelClassName}>
                                Change stage
                            </label>
                            <select
                                id="lead-stage"
                                name="stage"
                                defaultValue={lead.stage}
                                disabled={isSubmitting}
                                onChange={handleStageChange}
                                autoFocus
                                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                            >
                                {stageValues.map((stage) => (
                                    <option key={stage} value={stage}>
                                        {stageMeta[stage].label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsEditingStage(false)}
                            disabled={isSubmitting}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Cancel stage edit"
                            title="Cancel"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                </fetcher.Form>
            ) : null}

            {stageError ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {stageError}
                </div>
            ) : null}
        </section>
    );
}

function LeadPulse({ lead }: { lead: SafeLeadDetailType }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Pulse</p>

            <dl className="mt-4 grid gap-3">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                    <dt className="text-sm text-slate-500">Linked tasks</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                        {lead.taskLinks.length}
                    </dd>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                    <dt className="text-sm text-slate-500">Freshness</dt>
                    <dd className="text-right text-sm font-semibold text-slate-900">
                        {getFreshnessText(lead.updatedAt)}
                    </dd>
                </div>
            </dl>
        </section>
    );
}

function RecordMeta({ lead }: { lead: SafeLeadDetailType }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Record</p>

            <dl className="mt-4 space-y-4">
                <div>
                    <dt className={labelClassName}>Lead ID</dt>
                    <dd className="mt-1 break-all font-mono text-xs leading-5 text-slate-500">
                        {lead.id}
                    </dd>
                </div>

                <div>
                    <dt className={labelClassName}>Created by</dt>
                    <dd className="mt-1 break-all font-mono text-xs leading-5 text-slate-500">
                        {lead.createdBy}
                    </dd>
                </div>

                <div>
                    <dt className={labelClassName}>Workspace</dt>
                    <dd className="mt-1 break-all font-mono text-xs leading-5 text-slate-500">
                        {lead.workspaceId}
                    </dd>
                </div>
            </dl>
        </section>
    );
}

function UnlinkTaskButton({ taskId, canEditLead }: { taskId: string; canEditLead: boolean }) {
    const fetcher = useFetcher<unknown>();
    const isSubmitting = fetcher.state === "submitting";

    if (!canEditLead) return null;

    return (
        <fetcher.Form method="post" action={`${taskId}/unlinkTask`}>
            <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Unlink task"
                title="Unlink"
            >
                <XIcon className="h-4 w-4" />
            </button>
        </fetcher.Form>
    );
}

function LinkedTaskCard({
    task,
    lead,
    canEditLead,
}: {
    task: LeadTask;
    lead: SafeLeadDetailType;
    canEditLead: boolean;
}) {
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
                        <span
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        >
                            {formatShortDate(task.dueDate)}
                        </span>
                    </div>

                    <h3 className="break-words text-sm font-semibold text-slate-950">
                        {task.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {task.description || "No description added yet."}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Link
                        to={`/board/workspaces/${lead.workspaceId}/projects/${task.projectId}/columns/${task.columnId}/tasks/${task.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        aria-label="Open task"
                        title="Open task"
                    >
                        <EyeIcon className="h-4 w-4" />
                    </Link>

                    <UnlinkTaskButton taskId={task.id} canEditLead={canEditLead} />
                </div>
            </div>
        </article>
    );
}

function LinkedTasks({
    lead,
    canEditLead,
}: {
    lead: SafeLeadDetailType;
    canEditLead: boolean;
}) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                <div>
                    <p className="text-sm font-semibold text-slate-950">Linked tasks</p>
                    <p className="mt-1 text-sm text-slate-500">
                        {lead.taskLinks.length} task{lead.taskLinks.length !== 1 ? "s" : ""} attached to this lead.
                    </p>
                </div>

                {canEditLead ? (
                    <Link
                        to="linkTask"
                        className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Link task
                    </Link>
                ) : null}
            </div>

            <div className="p-5 sm:p-6">
                {lead.taskLinks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-slate-800">
                            No linked tasks yet
                        </p>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Keep follow-ups tied to this lead when a project and column are ready.
                        </p>

                        {canEditLead ? (
                            <Link
                                to="linkTask"
                                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Link task
                            </Link>
                        ) : null}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {lead.taskLinks.map((task) => (
                            <LinkedTaskCard
                                key={task.id}
                                task={task}
                                lead={lead}
                                canEditLead={canEditLead}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function getRole(workspaceData: unknown) {
    if (
        !workspaceData ||
        typeof workspaceData !== "object" ||
        isActionError(workspaceData) ||
        !("myMembership" in workspaceData)
    ) {
        return undefined;
    }

    return (workspaceData as { myMembership: SafeMemberResponse }).myMembership.role;
}

function roleCanManage(role: SafeMemberResponse["role"] | undefined) {
    return role === "owner" || role === "admin";
}

export function DetailLeadPage() {
    const data = useLoaderData<typeof GetLeadByIdLoader>();
    const workspaceData = useRouteLoaderData<typeof GetByIdLoader>("workspace-detail");
    const auth = useAuth();
    const navigate = useNavigate();
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    if (!data || isActionError(data)) {
        return (
            <section className="mx-auto max-w-3xl">
                <div className="rounded-lg border border-red-200 bg-white p-8 shadow-sm">
                    <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        Lead load error
                    </div>

                    <h1 className="mt-4 text-2xl font-semibold text-slate-950">
                        Unable to load lead
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        {getErrorMessage(data)}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back
                    </button>
                </div>
            </section>
        );
    }

    const lead = data as SafeLeadDetailType;
    const role = getRole(workspaceData);
    const canEditLead = roleCanManage(role) || auth.user?.id === lead.createdBy;

    function openProfileEditor() {
        if (canEditLead) {
            setIsEditingProfile(true);
        }
    }

    function closeProfileEditor() {
        setIsEditingProfile(false);
    }

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    to=".."
                    relative="path"
                    className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Leads
                </Link>

                <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {getFreshnessText(lead.updatedAt)}
                </span>
            </div>

            <LeadHeader
                lead={lead}
            />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-5">
                    <LeadProfileCard
                        key={`${lead.id}-${String(lead.updatedAt)}-${isEditingProfile ? "edit" : "view"}`}
                        lead={lead}
                        canEditLead={canEditLead}
                        isEditing={isEditingProfile}
                        onEdit={openProfileEditor}
                        onCancel={closeProfileEditor}
                    />

                    <LinkedTasks lead={lead} canEditLead={canEditLead} />
                </div>

                <aside className="min-w-0 space-y-5 xl:sticky xl:top-4 xl:self-start">
                    <StageControl lead={lead} canEditLead={canEditLead} />
                    <LeadPulse lead={lead} />
                    <RecordMeta lead={lead} />
                </aside>
            </div>

            <Outlet context={{ lead, canEditLead }} />
        </section>
    );
}
