import { useAuth } from "../../features/auth/auth.store";
import { useEffect } from "react";
import { refreshAccessToken } from "../shared/lib/http-interceptors";

import { Navigate, useLocation } from "react-router-dom";

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (auth.status === "checking") {
            refreshAccessToken();
        }
    }, [auth.status]);

    if (auth.status === "checking") {
        return null;
    }

    if (auth.status === "authenticated") {
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get("redirectTo");

        const safeRedirect =
            redirectTo &&
                redirectTo.startsWith("/") &&
                !redirectTo.startsWith("//")
                ? redirectTo
                : "/";

        return <Navigate to={safeRedirect} replace />;
    }

    return <>{children}</>;
}
