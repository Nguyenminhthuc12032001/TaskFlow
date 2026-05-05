import { useState, type ChangeEvent } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router-dom";
import PhoneInput, { type Value as PhoneNumberValue } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import vi from "react-phone-number-input/locale/vi";
import { ArrowLeftIcon, CheckIcon, PlusIcon } from "../../components/ui/Icons";
import type { CreateLeadAction } from "../../features/lead/action/create.action";
import type { ActionError } from "../../features/type";

const stageOptions = [
    {
        value: "new",
        label: "New",
        description: "Fresh lead",
        dotClassName: "bg-sky-500",
        badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    },
    {
        value: "contacted",
        label: "Contacted",
        description: "First touch done",
        dotClassName: "bg-indigo-500",
        badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    {
        value: "qualified",
        label: "Qualified",
        description: "Clear fit",
        dotClassName: "bg-emerald-500",
        badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
        value: "won",
        label: "Won",
        description: "Ready to deliver",
        dotClassName: "bg-lime-500",
        badgeClassName: "border-lime-200 bg-lime-50 text-lime-700",
    },
    {
        value: "lost",
        label: "Lost",
        description: "Closed out",
        dotClassName: "bg-rose-500",
        badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    },
] as const;

type StageValue = (typeof stageOptions)[number]["value"];

type LeadFormState = {
    name: string;
    email: string;
    phone: string;
    source: string;
    stage: StageValue;
    note: string;
};

const initialFormState: LeadFormState = {
    name: "",
    email: "",
    phone: "",
    source: "",
    stage: "new",
    note: "",
};

function getFieldError(actionError: ActionError | undefined, field: string) {
    return actionError?.fieldErrors?.[field]?.[0];
}

function getStageMeta(stage: StageValue) {
    return stageOptions.find((option) => option.value === stage) ?? stageOptions[0];
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

function getInputClass(error?: string) {
    return [
        "h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition",
        "placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        error
            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
    ].join(" ");
}

function getTextareaClass(error?: string) {
    return [
        "min-h-32 w-full resize-none rounded-lg border bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition",
        "placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        error
            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
            : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
    ].join(" ");
}

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) return null;

    return (
        <p id={id} className="mt-1.5 text-sm text-red-600" role="alert">
            {message}
        </p>
    );
}

export function CreateLeadPage() {
    const actionError = useActionData<typeof CreateLeadAction>() as
        | ActionError
        | undefined;
    const navigation = useNavigation();
    const [formState, setFormState] = useState<LeadFormState>(initialFormState);

    const isSubmitting = navigation.state === "submitting";
    const selectedStage = getStageMeta(formState.stage);
    const previewPhone = formState.phone;

    const nameError = getFieldError(actionError, "name");
    const emailError = getFieldError(actionError, "email");
    const phoneError = getFieldError(actionError, "phone");
    const sourceError = getFieldError(actionError, "source");
    const stageError = getFieldError(actionError, "stage");
    const noteError = getFieldError(actionError, "note");
    const generalError = actionError?.formErrors?.[0] || actionError?.errorMessage;

    function updateField(
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value } = event.currentTarget;

        setFormState((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function updateStage(stage: StageValue) {
        setFormState((current) => ({
            ...current,
            stage,
        }));
    }

    function updatePhone(phone?: PhoneNumberValue) {
        setFormState((current) => ({
            ...current,
            phone: phone ?? "",
        }));
    }

    return (
        <section className="mx-auto max-w-6xl">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    to=".."
                    relative="path"
                    className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Leads
                </Link>

                <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                    New record
                </span>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <Form
                    method="post"
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                    noValidate
                >
                    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                        <p className="text-sm font-medium text-slate-500">Lead</p>
                        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                            Create lead
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Capture the contact, source, stage, and first note in one focused flow.
                        </p>
                    </div>

                    <div className="space-y-6 px-5 py-5 sm:px-6">
                        {generalError ? (
                            <div
                                role="alert"
                                aria-live="polite"
                                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                            >
                                {generalError}
                            </div>
                        ) : null}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="name"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Lead name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formState.name}
                                    onChange={updateField}
                                    required
                                    minLength={5}
                                    maxLength={100}
                                    autoComplete="name"
                                    disabled={isSubmitting}
                                    placeholder="Example: Nguyen Minh Anh"
                                    aria-invalid={!!nameError}
                                    aria-describedby={nameError ? "lead-name-error" : undefined}
                                    className={getInputClass(nameError)}
                                />
                                <FieldError id="lead-name-error" message={nameError} />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formState.email}
                                    onChange={updateField}
                                    maxLength={120}
                                    autoComplete="email"
                                    disabled={isSubmitting}
                                    placeholder="lead@example.com"
                                    aria-invalid={!!emailError}
                                    aria-describedby={emailError ? "lead-email-error" : undefined}
                                    className={getInputClass(emailError)}
                                />
                                <FieldError id="lead-email-error" message={emailError} />
                            </div>

                            <div>
                                <label
                                    htmlFor="phone"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Phone
                                </label>
                                <PhoneInput
                                    id="phone"
                                    flags={flags}
                                    labels={vi}
                                    defaultCountry="VN"
                                    value={formState.phone}
                                    onChange={updatePhone}
                                    disabled={isSubmitting}
                                    placeholder="084 227 6949"
                                    autoComplete="tel"
                                    aria-invalid={!!phoneError}
                                    aria-describedby={phoneError ? "lead-phone-error" : undefined}
                                    className={[
                                        "taskflow-phone-input",
                                        phoneError ? "taskflow-phone-input--error" : "",
                                        isSubmitting ? "taskflow-phone-input--disabled" : "",
                                    ].join(" ")}
                                />
                                <input type="hidden" name="phone" value={formState.phone} />
                                <FieldError id="lead-phone-error" message={phoneError} />
                            </div>

                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="source"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Source
                                </label>
                                <input
                                    id="source"
                                    name="source"
                                    type="text"
                                    value={formState.source}
                                    onChange={updateField}
                                    minLength={10}
                                    maxLength={100}
                                    autoComplete="off"
                                    disabled={isSubmitting}
                                    placeholder="Website contact form"
                                    aria-invalid={!!sourceError}
                                    aria-describedby={sourceError ? "lead-source-error" : undefined}
                                    className={getInputClass(sourceError)}
                                />
                                <FieldError id="lead-source-error" message={sourceError} />
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="text-sm font-medium text-slate-700">
                                    Stage
                                </label>
                                <span className="text-xs text-slate-400">
                                    {selectedStage.label}
                                </span>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-5">
                                {stageOptions.map((option) => (
                                    <label key={option.value} className="block">
                                        <input
                                            type="radio"
                                            name="stage"
                                            value={option.value}
                                            checked={formState.stage === option.value}
                                            onChange={() => updateStage(option.value)}
                                            disabled={isSubmitting}
                                            className="peer sr-only"
                                            aria-invalid={!!stageError}
                                            aria-describedby={
                                                stageError ? "lead-stage-error" : undefined
                                            }
                                        />
                                        <span className="flex min-h-20 cursor-pointer flex-col rounded-lg border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50 peer-checked:border-slate-950 peer-checked:bg-slate-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className={`h-2 w-2 rounded-full ${option.dotClassName}`}
                                                />
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {option.label}
                                                </span>
                                            </span>
                                            <span className="mt-1 text-xs leading-5 text-slate-500">
                                                {option.description}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <FieldError id="lead-stage-error" message={stageError} />
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label
                                    htmlFor="note"
                                    className="text-sm font-medium text-slate-700"
                                >
                                    First note
                                </label>
                                <span className="text-xs text-slate-400">
                                    {formState.note.length}/200
                                </span>
                            </div>
                            <textarea
                                id="note"
                                name="note"
                                value={formState.note}
                                onChange={updateField}
                                required
                                minLength={5}
                                maxLength={200}
                                disabled={isSubmitting}
                                placeholder="Add context, intent, or the next follow-up..."
                                aria-invalid={!!noteError}
                                aria-describedby={noteError ? "lead-note-error" : undefined}
                                className={getTextareaClass(noteError)}
                            />
                            <FieldError id="lead-note-error" message={noteError} />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                        <Link
                            to=".."
                            relative="path"
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <PlusIcon className="h-4 w-4" />
                            {isSubmitting ? "Creating..." : "Create lead"}
                        </button>
                    </div>
                </Form>

                <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
                    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                                    {getInitials(formState.name)}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-950">
                                        {formState.name || "Unnamed lead"}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-slate-500">
                                        {formState.email || previewPhone || "No contact yet"}
                                    </p>
                                </div>
                            </div>

                            <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${selectedStage.badgeClassName}`}
                            >
                                {selectedStage.label}
                            </span>
                        </div>

                        <dl className="mt-5 grid min-w-0 gap-3 text-sm">
                            <div className="min-w-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                                <dt className="text-xs font-medium text-slate-400">Source</dt>
                                <dd
                                    className="mt-1 line-clamp-2 font-medium leading-5 text-slate-700 [overflow-wrap:anywhere]"
                                    title={formState.source || undefined}
                                >
                                    {formState.source || "Not set"}
                                </dd>
                            </div>

                            <div className="min-w-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                                <dt className="text-xs font-medium text-slate-400">Note</dt>
                                <dd
                                    className="mt-1 line-clamp-5 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]"
                                    title={formState.note || undefined}
                                >
                                    {formState.note || "No note yet"}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-semibold text-slate-950">
                            Pipeline position
                        </p>

                        <div className="mt-4 space-y-3">
                            {stageOptions.map((option) => {
                                const isSelected = formState.stage === option.value;

                                return (
                                    <div
                                        key={option.value}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <span
                                                className={`h-2 w-2 rounded-full ${option.dotClassName}`}
                                            />
                                            <span
                                                className={[
                                                    "truncate text-sm",
                                                    isSelected
                                                        ? "font-semibold text-slate-950"
                                                        : "text-slate-500",
                                                ].join(" ")}
                                            >
                                                {option.label}
                                            </span>
                                        </span>

                                        {isSelected ? (
                                            <CheckIcon className="h-4 w-4 text-slate-900" />
                                        ) : (
                                            <span className="h-4 w-4" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    );
}
