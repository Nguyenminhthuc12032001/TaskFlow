import { UserMenu } from "./UserMenu";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
      
      {/* Left */}
      <div className="text-sm font-medium text-neutral-700">
        Dashboard
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  );
}