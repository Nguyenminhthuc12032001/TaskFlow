import { useMemo } from "react";
import { Form, Link, useLocation } from "react-router-dom";


export function ResetPassword() {
    const location = useLocation();

    const resetToken = useMemo(() => {
        const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;

        const params = new URLSearchParams(hash);

        const token = params.get('token') ?? '';

        return decodeURIComponent(token);
    }, [location.hash]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your new password below
          </p>
        </div>

        <Form method="post" className="space-y-4">
          <input type="hidden" name="resetToken" value={resetToken} />

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              New password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Confirm password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-black py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98]"
          >
            Reset password
          </button>
        </Form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Back to{" "}
          <Link to="/auth/login" className="font-medium text-black hover:underline">
            sign in
          </Link>
        </p>
      </div>
    </div>
  );
}