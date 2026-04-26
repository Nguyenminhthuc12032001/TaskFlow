import { useState } from "react";
import { Form, Link } from "react-router-dom";
import { useAuth } from "../../features/auth/auth.store";

function getInitials(name?: string | null, email?: string | null) {
    const source = name || email || "User";
    const initials = source
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("");

    return (initials || "U").slice(0, 2).toUpperCase();
}

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
                    className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                    Log in
                </Link>

                <Link
                    to="/auth/register"
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
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
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                aria-label="Open user menu"
            >
                {getInitials(auth.user.name, auth.user.email)}
            </button>

            {open && (
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10">
                    <div className="px-4 py-3">
                        <p className="truncate text-sm font-semibold text-zinc-950">
                            {auth.user.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                            {auth.user.email}
                        </p>
                    </div>

                    <div className="h-px bg-zinc-100" />

                    <div className="py-1">
                        <Link
                            to="/auth/change-password"
                            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
                            onClick={() => setOpen(false)}
                        >
                            Change password
                        </Link>
                    </div>

                    <div className="h-px bg-zinc-100" />

                    <Form method="post" action="/auth/logout">
                        <button
                            type="submit"
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
                        >
                            Log out
                        </button>
                    </Form>
                </div>
            )}
        </div>
    );
}
