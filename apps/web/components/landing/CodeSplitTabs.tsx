'use client';
import { useState } from 'react';
import { CopyButton } from '@/components/ui/CopyButton';

interface Tab {
  label: string;
  code: string;
  html: string;
}

export function CodeSplitTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const current = tabs[active];

  return (
    <div className="code-block-outer">
      <div className="code-block-header">
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActive(i)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid transparent',
                background: i === active ? 'var(--surface-2)' : 'transparent',
                color: i === active ? 'var(--text)' : 'var(--muted)',
                borderColor: i === active ? 'var(--border)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 160ms ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CopyButton text={current.code} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: current.html }} />
    </div>
  );
}
