import { Form, Link, useActionData, useNavigation } from "react-router-dom";
import type { ActionError } from "../../app/routeAction/type";

export function ForgotPassword() {
  const actionError: ActionError | undefined = useActionData();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const emailError = actionError?.fieldErrors?.email?.[0];
  const formError = actionError?.formErrors?.[0];
  const errorMessage = actionError?.errorMessage;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your email and we’ll send you a reset link
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
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Email
            </label>

            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="you@example.com"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition ${
                emailError
                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-neutral-300 focus:border-black focus:ring-1 focus:ring-black"
              }`}
            />

            <div className="mt-1 min-h-5">
              {emailError ? (
                <p id="email-error" className="text-sm text-red-500" role="alert">
                  {emailError}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-black py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </Form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Remember your password?{" "}
          <Link
            to="/auth/login"
            className="cursor-pointer font-medium text-black hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}