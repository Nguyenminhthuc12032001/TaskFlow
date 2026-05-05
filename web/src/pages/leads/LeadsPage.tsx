import { Outlet, useParams } from "react-router-dom";

export function LeadsPage() {
  const { workspaceId } = useParams();

  if (!workspaceId) {
    return (
      <main className="min-h-full bg-zinc-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    );
  }

  return (
    <main>
      <Outlet />
    </main>
  );
}
