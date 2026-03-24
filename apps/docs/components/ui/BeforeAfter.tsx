interface BeforeAfterProps {
  before: string;
  after:  string;
  label?: string;
}

export function BeforeAfter({ before, after, label }: BeforeAfterProps) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-fd-border bg-fd-card p-4">
      {label && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
          {label}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded border border-fd-border bg-fd-background px-2.5 py-1.5 font-mono text-xs text-[#6366f1]">
          {before}
        </code>
        <svg className="h-4 w-4 shrink-0 text-fd-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        <code className="rounded border border-fd-border bg-fd-background px-2.5 py-1.5 font-mono text-xs text-emerald-600">
          {after}
        </code>
      </div>
    </div>
  );
}
