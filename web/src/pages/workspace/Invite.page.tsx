import { Form, Link, useActionData, useNavigation } from "react-router-dom";
import type { ActionError } from "../../features/type";
import { WorkspaceRole } from "../../../../api/prisma/generated/enums";

export function InvitePage() {
  const actionError: ActionError | undefined = useActionData();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const emailError = actionError?.fieldErrors?.email?.[0];
  const roleError = actionError?.fieldErrors?.role?.[0];
  const formError = actionError?.formErrors?.[0];
  const errorMessage = actionError?.errorMessage;

  return (
    <section className="min-h-full bg-linear-to-b from-white via-slate-50 to-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-4xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-slate-200/70 px-6 py-6 sm:px-8">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Member invitation
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Invite a new member
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Add a teammate to your workspace by entering their email address
              and selecting the right role.
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
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-800"
                >
                  Invitee email
                </label>

                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  placeholder="Example: teammate@email.com"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "invitee-error" : undefined}
                  className={[
                    "block h-14 w-full rounded-2xl border bg-white px-4 text-[15px] text-slate-900 shadow-sm outline-none transition",
                    "placeholder:text-slate-400",
                    emailError
                      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                      : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70",
                  ].join(" ")}
                />

                <div className="mt-2 min-h-5">
                  {emailError ? (
                    <p
                      id="invitee-error"
                      className="text-sm text-red-600"
                      role="alert"
                    >
                      {emailError}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Use the email address your teammate signs in with.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-medium text-slate-800"
                >
                  Member role
                </label>

                <select
                  name="role"
                  id="role"
                  defaultValue="member"
                  aria-invalid={!!roleError}
                  aria-describedby={roleError ? "role-error" : undefined}
                  className={[
                    "block h-14 w-full rounded-2xl border bg-white px-4 text-[15px] text-slate-900 shadow-sm outline-none transition",
                    roleError
                      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                      : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70",
                  ].join(" ")}
                >
                  <option value={WorkspaceRole.admin}>Admin</option>
                  <option value={WorkspaceRole.member}>Member</option>
                  <option value={WorkspaceRole.viewer}>Viewer</option>
                </select>

                <div className="mt-2 min-h-5">
                  {roleError ? (
                    <p
                      id="role-error"
                      className="text-sm text-red-600"
                      role="alert"
                    >
                      {roleError}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Choose permissions carefully based on what they need to access.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <Link
                  to=".."
                  relative="path"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Back
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Sending invite..." : "Send invitation"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}