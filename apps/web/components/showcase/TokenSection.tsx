import { DEFAULT_CONFIG } from '@holi.dev/core';

export type TokenSectionKey = 'colors' | 'spacing' | 'radius' | 'typography';

interface TokenSectionProps {
  section: TokenSectionKey;
}

export function TokenSection({ section }: TokenSectionProps) {
  switch (section) {
    case 'colors':     return <ColorsSection />;
    case 'spacing':    return <SpacingSection />;
    case 'radius':     return <RadiusSection />;
    case 'typography': return <TypographySection />;
  }
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="showcase-section-header">
      <h2 className="showcase-section-title">{title}</h2>
      <span className="showcase-section-count">{count} tokens</span>
    </div>
  );
}

function ColorsSection() {
  const colors = Object.entries(DEFAULT_CONFIG.tokens.color ?? {});
  return (
    <div>
      <SectionHeader title="Colors" count={colors.length} />
      <div className="token-card-grid">
        {colors.map(([name, value]) => (
          <div key={name} className="token-card">
            <div className="token-card-swatch" style={{ background: value }} />
            <div className="token-card-info">
              <div className="token-card-name">color.{name}</div>
              <div className="token-card-value">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpacingSection() {
  const spacings = Object.entries(DEFAULT_CONFIG.tokens.spacing ?? {});
  const maxPx = Math.max(...spacings.map(([, v]) => parseInt(v)));
  return (
    <div>
      <SectionHeader title="Spacing" count={spacings.length} />
      <div className="token-spacing-list">
        {spacings.map(([name, value]) => {
          const px = parseInt(value);
          const pct = Math.round((px / maxPx) * 100);
          return (
            <div key={name} className="token-spacing-row">
              <span className="token-card-name" style={{ minWidth: 120 }}>spacing.{name}</span>
              <div className="token-spacing-bar-wrap">
                <div className="token-spacing-bar" style={{ width: `${pct}%` }} />
              </div>
              <span className="token-card-value" style={{ minWidth: 40, textAlign: 'right' }}>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadiusSection() {
  const radii = Object.entries(DEFAULT_CONFIG.tokens.radius ?? {});
  return (
    <div>
      <SectionHeader title="Border Radius" count={radii.length} />
      <div className="token-radius-grid">
        {radii.map(([name, value]) => (
          <div key={name} className="token-card">
            <div className="token-radius-preview">
              <div className="token-radius-box" style={{ borderRadius: value }} />
            </div>
            <div className="token-card-info">
              <div className="token-card-name">radius.{name}</div>
              <div className="token-card-value">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographySection() {
  const typo = Object.entries(DEFAULT_CONFIG.tokens.typography ?? {});
  return (
    <div>
      <SectionHeader title="Typography" count={typo.length} />
      <div className="token-typo-list">
        {typo.map(([name, value]) => (
          <div key={name} className="token-typo-row">
            <span className="token-card-name">typography.{name}</span>
            <span className="token-card-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
