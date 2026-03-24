'use client';

import { useState, useCallback } from 'react';

interface AnimationDemoProps {
  name:     string;
  cssClass: string;
  label?:   string;
}

export function AnimationDemo({ name, cssClass, label }: AnimationDemoProps) {
  const [key, setKey] = useState(0);
  const replay        = useCallback(() => setKey(k => k + 1), []);

  return (
    <div className="my-4 flex items-center gap-6 rounded-xl border border-fd-border bg-fd-card p-6">
      <div
        key={key}
        className={`h-16 w-16 shrink-0 rounded-lg bg-[#6366f1] ${cssClass}`}
        style={{ animationFillMode: 'both' }}
        title={name}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fd-foreground truncate">{label ?? `.animate-${name}`}</p>
        <p className="text-xs text-fd-muted-foreground">Click Replay to see the animation</p>
      </div>
      <button
        type="button"
        onClick={replay}
        className="shrink-0 rounded-lg border border-[#6366f1]/30 bg-fd-background px-3 py-1.5 text-xs font-medium text-[#6366f1] hover:bg-[#6366f1]/10 transition-colors"
      >
        Replay
      </button>
    </div>
  );
}
