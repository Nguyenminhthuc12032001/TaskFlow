import { Form, Link, useActionData, useNavigation } from "react-router-dom";
import type { ActionError } from "../../features/type";

export function CreateProjectPage() {
    const actionError: ActionError | undefined = useActionData();
    const navigation = useNavigation();

    const isSubmitting = navigation.state === "submitting";

    const nameError = actionError?.fieldErrors?.name?.[0];
    const descriptionError = actionError?.fieldErrors?.description?.[0];
    const formError = actionError?.formErrors?.[0];
    const errorMessage = actionError?.errorMessage;

    return (
        <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-4xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                    <div className="border-b border-slate-200/70 px-6 py-6 sm:px-8">
                        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                            Project
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            Create a new project
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                            Start a project with a clear name and a short description so your
                            team can understand its purpose right away.
                        </p>
                    </div>

                    <div className="px-6 py-6 sm:px-8 sm:py-8">
                        <Form method="post" className="space-y-6" noValidate>
                            {formError ? (
                                <div
                                    role="alert"
                                    aria-live="polite"
                                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {formError}
                                </div>
                            ) : null}

                            {errorMessage ? (
                                <div
                                    role="alert"
                                    aria-live="polite"
                                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {errorMessage}
                                </div>
                            ) : null}

                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-medium text-slate-800"
                                >
                                    Project name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    maxLength={80}
                                    placeholder="Example: TaskFlow API"
                                    aria-invalid={!!nameError}
                                    aria-describedby={nameError ? "name-error" : "name-help"}
                                    className={[
                                        "block h-14 w-full rounded-2xl border bg-white px-4 text-[15px] text-slate-900 shadow-sm outline-none transition",
                                        "placeholder:text-slate-400",
                                        nameError
                                            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                            : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70",
                                    ].join(" ")}
                                />

                                <div className="mt-2 min-h-5">
                                    {nameError ? (
                                        <p
                                            id="name-error"
                                            className="text-sm text-red-600"
                                            role="alert"
                                        >
                                            {nameError}
                                        </p>
                                    ) : (
                                        <p id="name-help" className="text-sm text-slate-500">
                                            Use a short, clear name your team will recognize.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="description"
                                    className="mb-2 block text-sm font-medium text-slate-800"
                                >
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    id="description"
                                    rows={5}
                                    maxLength={300}
                                    placeholder="Write a short summary about this project..."
                                    aria-invalid={!!descriptionError}
                                    aria-describedby={
                                        descriptionError ? "description-error" : "description-help"
                                    }
                                    className={[
                                        "block w-full rounded-2xl border bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm outline-none transition resize-none",
                                        "placeholder:text-slate-400",
                                        descriptionError
                                            ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                            : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70",
                                    ].join(" ")}
                                />

                                <div className="mt-2 min-h-5">
                                    {descriptionError ? (
                                        <p
                                            id="description-error"
                                            className="text-sm text-red-600"
                                            role="alert"
                                        >
                                            {descriptionError}
                                        </p>
                                    ) : (
                                        <p id="description-help" className="text-sm text-slate-500">
                                            Optional, but useful for giving context to members.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                                <Link
                                    to=".." 
                                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Your projects
                                </Link>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? "Creating..." : "Create project"}
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </section>
    );
}