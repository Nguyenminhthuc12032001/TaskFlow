import { useState } from "react";
import { useAuth } from "../../features/auth/auth.store";
import { Form, Link } from "react-router-dom";

export function UserMenu() {
    const [open, setOpen] = useState(false);
    const auth = useAuth();

    function toggle() {
        setOpen((prev) => !prev);
    }

    if (!auth.user) {
        return (
            <div className="flex items-center gap-2">
                <Link
                    to="/auth/login"
                    className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.98]"
                >
                    Log in
                </Link>

                <Link
                    to="/auth/register"
                    className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 active:scale-[0.98]"
                >
                    Sign up
                </Link>
            </div>
        );
    }

    return (
        <div className="relative flex items-center">
            <button
                type="button"
                onClick={toggle}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.98]"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.125a7.5 7.5 0 0 1 15 0"
                    />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                    {/* Info */}
                    <div className="px-4 py-3">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                            {auth.user.name}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                            {auth.user.email}
                        </p>
                    </div>

                    <div className="mx-3 h-px bg-neutral-200" />

                    <Form method="post" action="/auth/logout">
                        <button
                            type="submit"
                            className="w-full px-4 py-3 text-left text-sm font-medium text-neutral-700 transition-colors duration-200 hover:bg-neutral-50 hover:text-neutral-900"
                        >
                            Log out
                        </button>
                    </Form>
                </div>
            )}
        </div>
    );
}