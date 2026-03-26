'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { DEFAULT_CONFIG } from '@holi.dev/core';

const TOKEN_ITEMS = [
  { key: 'colors',     label: 'Colors',     tokenKey: 'color'      as const },
  { key: 'spacing',    label: 'Spacing',    tokenKey: 'spacing'    as const },
  { key: 'radius',     label: 'Radius',     tokenKey: 'radius'     as const },
  { key: 'typography', label: 'Typography', tokenKey: 'typography' as const },
];

export function ShowcaseSidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const active = searchParams.get('section') ?? 'colors';

  const navigate = (key: string) => router.replace(`/showcase?section=${key}`);

  return (
    <nav className="showcase-sidebar">
      <div className="sidebar-header">Design System</div>

      <div className="sidebar-group">
        <div className="sidebar-group-label">Tokens</div>
        {TOKEN_ITEMS.map(({ key, label, tokenKey }) => {
          const count = Object.keys(DEFAULT_CONFIG.tokens[tokenKey] ?? {}).length;
          return (
            <button
              key={key}
              className={`sidebar-item${active === key ? ' sidebar-item--active' : ''}`}
              onClick={() => navigate(key)}
            >
              {label}
              <span className="sidebar-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-group">
        <div className="sidebar-group-label">Components</div>
        {Object.entries(DEFAULT_CONFIG.components ?? {}).map(([name, comp]) => {
          const variantCount = Object.keys(comp.variants ?? {}).length;
          return (
            <button
              key={name}
              className={`sidebar-item${active === name ? ' sidebar-item--active' : ''}`}
              onClick={() => navigate(name)}
            >
              .{name}
              {variantCount > 0 && (
                <span className="sidebar-count">{variantCount}v</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
