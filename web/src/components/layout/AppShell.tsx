import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { Outlet } from "react-router-dom"

export function AppShell() {
    return (
        <div className="h-screen w-full">
            <Sidebar />
            <Topbar />

            <main>
                <Outlet />
            </main>
        </div>
    )
}