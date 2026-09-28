import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Framed terminal panel with an amber title strip. */
export function Panel({ title, aside, className = "", children }: PanelProps) {
  return (
    <section className={`flex min-h-0 min-w-0 flex-col border border-line bg-panel/90 ${className}`}>
      <header className="flex h-7 shrink-0 items-center justify-between border-b border-line bg-raised/60 px-3">
        <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          <span className="mr-1.5 text-accent/50">▍</span>
          {title}
        </h2>
        {aside}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
