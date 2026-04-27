import { NavLink } from "react-router-dom";

type StickySectionTab = {
  to: string;
  label: string;
  end?: boolean;
};

export function StickySectionTabs({
  tabs,
  ariaLabel,
  scopeLabel,
  topClassName,
  zClassName,
}: {
  tabs: StickySectionTab[];
  ariaLabel: string;
  scopeLabel: string;
  topClassName: string;
  zClassName: string;
}) {
  return (
    <div className={`sticky ${topClassName} ${zClassName} -mx-2 px-2 py-2`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full rounded-[1.75rem] bg-slate-50/80 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_72%,transparent)]" />

      <div className="relative max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav
          className="inline-flex min-w-max items-center gap-0.5 rounded-full border border-slate-200/70 bg-white/85 p-1 shadow-[0_16px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/80"
          aria-label={ariaLabel}
        >
          <span className="mr-1 inline-flex h-8 items-center rounded-full border border-slate-200/70 bg-slate-50/90 px-3 text-xs font-semibold text-slate-500">
            {scopeLabel}
          </span>

          {tabs.map((tab) => (
            <NavLink
              key={tab.to + tab.label}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                [
                  "relative inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  isActive
                    ? "bg-slate-950 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_9px_20px_rgba(15,23,42,0.20)]"
                    : "text-slate-500 hover:bg-slate-950/[0.04] hover:text-slate-950",
                ].join(" ")
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
