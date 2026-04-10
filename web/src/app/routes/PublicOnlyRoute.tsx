import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth.store";
import { useEffect } from "react";
import { refreshAccessToken } from "../shared/lib/http-interceptors";

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const auth = useAuth();

    useEffect(() => {
        if (auth.status === "checking") {
            refreshAccessToken();
        }
    }, [auth.status])

    if (auth.status === "authenticated") {
        return <Navigate to="/" replace />;
    }

    return <>
        {children}</>;
}