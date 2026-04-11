export function BoardPage() {
  const workspaces = []; // ví dụ data lấy từ API/store

  const hasWorkspace = workspaces.length > 0;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Board</h1>

      {!hasWorkspace ? (
        <button className="mt-4 rounded-lg bg-black px-4 py-2 text-white">
          Create New Workspace
        </button>
      ) : (
        <div className="mt-4">
          <h2 className="text-lg font-medium">Your Workspaces</h2>
          <ul className="mt-2 space-y-2">
            {workspaces.map((workspace) => (
              <li key={workspace.id}>{workspace.name}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}