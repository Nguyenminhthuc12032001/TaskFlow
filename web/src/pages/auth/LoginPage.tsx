import { Form, Link } from "react-router-dom";

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Sign in to your account
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Welcome back
          </p>
        </div>

        {/* Form */}
        <Form method="post" className="space-y-4">
          
          {/* Email */}
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
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-black py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98]"
          >
            Sign in
          </button>
        </Form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-neutral-500">
          Don’t have an account?{" "}
          <Link to="/auth/register" className="cursor-pointer font-medium text-black hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}