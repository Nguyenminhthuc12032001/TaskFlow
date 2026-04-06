import { Form, Link } from "react-router-dom";

export function ChangePassword() {
    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-neutral-50 px-4 py-10">
            <div className="mx-auto w-full max-w-md">
                <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl">
                    <div className="px-6 pb-6 pt-7 sm:px-8">
                        <div className="mb-6">
                            <p className="text-sm font-medium text-neutral-500">
                                Account Settings
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                                Change Password
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-neutral-500">
                                Update your password to keep your account secure.
                            </p>
                        </div>

                        <Form method="post" className="space-y-5">
                            <div>
                                <label
                                    htmlFor="currentPassword"
                                    className="mb-2 block text-sm font-medium text-neutral-700"
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
                                    className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-200/60"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="newPassword"
                                    className="mb-2 block text-sm font-medium text-neutral-700"
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
                                    className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-200/60"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="mb-2 block text-sm font-medium text-neutral-700"
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
                                    className="block w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-200/60"
                                />
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                                <p className="text-xs leading-5 text-neutral-500">
                                    Your new password should be strong and different from your current password.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Link
                                    to="/"
                                    className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.98]"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="submit"
                                    className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 active:scale-[0.98]"
                                >
                                    Update Password
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </main>
    );
}