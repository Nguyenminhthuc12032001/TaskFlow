import { Form, Link, useActionData, useNavigation } from "react-router-dom";
import type { ActionError } from "../../app/routeAction/type";

export function ChangePassword() {
  const actionError: ActionError | undefined = useActionData();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const currentPasswordError = actionError?.fieldErrors?.currentPassword?.[0];
  const newPasswordError = actionError?.fieldErrors?.newPassword?.[0];
  const confirmPasswordError = actionError?.fieldErrors?.confirmPassword?.[0];
  const formError = actionError?.formErrors?.[0];
  const errorMessage = actionError?.errorMessage;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Change your password
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Keep your account secure with a new password
          </p>
        </div>

        <Form method="post" className="space-y-4" noValidate>
          {formError ? (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {formError}
            </div>
          ) : null}

          {errorMessage ? (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {errorMessage}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="currentPassword"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Current Password
            </label>

            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              autoComplete="current-password"
              placeholder="Enter your current password"
              aria-invalid={!!currentPasswordError}
              aria-describedby={
                currentPasswordError ? "current-password-error" : undefined
              }
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition ${
                currentPasswordError
                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-neutral-300 focus:border-black focus:ring-1 focus:ring-black"
              }`}
            />

            <div className="mt-1 min-h-5">
              {currentPasswordError ? (
                <p
                  id="current-password-error"
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {currentPasswordError}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              New Password
            </label>

            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              autoComplete="new-password"
              placeholder="Enter your new password"
              aria-invalid={!!newPasswordError}
              aria-describedby={newPasswordError ? "new-password-error" : undefined}
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition ${
                newPasswordError
                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-neutral-300 focus:border-black focus:ring-1 focus:ring-black"
              }`}
            />

            <div className="mt-1 min-h-5">
              {newPasswordError ? (
                <p
                  id="new-password-error"
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {newPasswordError}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Confirm New Password
            </label>

            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              aria-invalid={!!confirmPasswordError}
              aria-describedby={
                confirmPasswordError ? "confirm-password-error" : undefined
              }
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition ${
                confirmPasswordError
                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-neutral-300 focus:border-black focus:ring-1 focus:ring-black"
              }`}
            />

            <div className="mt-1 min-h-5">
              {confirmPasswordError ? (
                <p
                  id="confirm-password-error"
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {confirmPasswordError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
            <p className="text-sm text-neutral-500">
              Use a strong password that is different from your current one.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Link
              to="/"
              className="flex-1 rounded-xl border border-neutral-300 bg-white py-2.5 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 active:scale-[0.98]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-black py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}