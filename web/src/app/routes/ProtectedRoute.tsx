import { useEffect, type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom";
import { refreshAccessToken } from "../shared/lib/http-interceptors";
import { useAuth } from "../../features/auth/auth.store";

export function ProtectedRoute({ children }: { children: ReactNode }) {
    const location = useLocation();
    const auth = useAuth();

    useEffect(() => {
        if (auth.status === "checking") {
            refreshAccessToken();
        }
    }, [auth.status])

    if (auth.status === "checking") {
        return <div>Loading...</div>;
    }

    if (auth.status === "unauthenticated") {
        return <Navigate to='/auth/login' state={{ from: location }} replace />
    }

    return <>
        {children}
    </>
}
