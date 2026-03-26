import { DEFAULT_CONFIG } from '@holi.dev/core';

interface SpacingRulerProps {
  name:  string;
  value: string;
}

export function SpacingRuler({ name, value }: SpacingRulerProps) {
  const px      = parseInt(value, 10);
  const maxPx   = 64;
  const widthPct = Math.min((px / maxPx) * 100, 100);

  return (
    <div className="flex items-center gap-4 py-1">
      <span className="w-6 shrink-0 text-right font-mono text-xs text-fd-muted-foreground">{name}</span>
      <div
        className="h-4 rounded bg-[#6366f1]/60"
        style={{ width: `${widthPct}%`, minWidth: '4px', maxWidth: '100%' }}
      />
      <span className="shrink-0 font-mono text-xs text-fd-muted-foreground">{value}</span>
    </div>
  );
}

export function SpacingRulerGrid() {
  const spacing = DEFAULT_CONFIG.tokens?.spacing ?? {};
  return (
    <div className="my-6 w-full max-w-md space-y-1">
      {Object.entries(spacing).map(([name, value]) => (
        <SpacingRuler key={name} name={name} value={String(value)} />
      ))}
    </div>
  );
}
