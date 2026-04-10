import { Form, Link, useActionData, useNavigation } from "react-router-dom";
import type { ActionError } from "../../app/routeAction/type";

export function LoginPage() {
  const actionError: ActionError | undefined = useActionData();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const emailError = actionError?.fieldErrors?.email?.[0];
  const passwordError = actionError?.fieldErrors?.password?.[0];
  const formError = actionError?.formErrors?.[0];
  const errorMessage = actionError?.errorMessage;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Sign in to your account
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Welcome back</p>
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
                <p
                  id="email-error"
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {emailError}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700"
              >
                Password
              </label>

              <Link
                to="/auth/forgot-password"
                className="text-sm font-medium text-neutral-500 transition hover:text-black hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="••••••••"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition ${
                passwordError
                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-neutral-300 focus:border-black focus:ring-1 focus:ring-black"
              }`}
            />

            <div className="mt-1 min-h-5">
              {passwordError ? (
                <p
                  id="password-error"
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {passwordError}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-black py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </Form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don’t have an account?{" "}
          <Link
            to="/auth/register"
            className="cursor-pointer font-medium text-black hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}