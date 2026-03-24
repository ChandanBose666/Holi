'use client';

import { useState } from 'react';

interface CompiledCSSProps {
  css:    string;
  label?: string;
}

export function CompiledCSS({ css, label = 'Compiled CSS output' }: CompiledCSSProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-fd-border">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between bg-fd-card px-4 py-2.5 text-xs font-medium text-fd-muted-foreground hover:bg-fd-accent transition-colors"
      >
        <span>{label}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <pre className="overflow-x-auto bg-[#0f172a] p-4 text-xs text-slate-300">
          <code>{css}</code>
        </pre>
      )}
    </div>
  );
}
