import { DEFAULT_CONFIG } from '@holi.dev/core';

function ColorSwatches() {
  const colors = Object.entries(DEFAULT_CONFIG.tokens.color ?? {});
  return (
    <div className="token-grid">
      <div className="token-grid-title">Colors</div>
      <div className="token-swatches">
        {colors.map(([name, value]) => (
          <div key={name} className="token-swatch">
            <div className="swatch-color" style={{ background: value }} />
            <div className="swatch-info">
              <div className="swatch-name">color.{name}</div>
              <div className="swatch-value">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpacingSwatches() {
  const spacings = Object.entries(DEFAULT_CONFIG.tokens.spacing ?? {});
  return (
    <div className="token-grid">
      <div className="token-grid-title">Spacing</div>
      <div className="spacing-swatches">
        {spacings.map(([name, value]) => {
          const px = parseInt(value);
          return (
            <div key={name} className="spacing-item">
              <div
                className="spacing-bar"
                style={{ width: Math.max(px, 4), height: 24 }}
              />
              <div className="spacing-label">
                <div>{name}</div>
                <div>{value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadiusSwatches() {
  const radii = Object.entries(DEFAULT_CONFIG.tokens.radius ?? {});
  return (
    <div className="token-grid">
      <div className="token-grid-title">Border Radius</div>
      <div className="spacing-swatches">
        {radii.map(([name, value]) => {
          const px = parseInt(value);
          return (
            <div key={name} className="spacing-item">
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: 'var(--accent-glow)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: value,
                }}
              />
              <div className="spacing-label">
                <div>{name}</div>
                <div>{value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TypographyTokens() {
  const typo = Object.entries(DEFAULT_CONFIG.tokens.typography ?? {});
  return (
    <div className="token-grid">
      <div className="token-grid-title">Typography</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {typo.map(([name, value]) => (
          <div
            key={name}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span
              className="swatch-name"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-2)' }}
            >
              typography.{name}
            </span>
            <span
              className="swatch-value"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)' }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TokenGrid() {
  return (
    <div>
      <ColorSwatches />
      <SpacingSwatches />
      <RadiusSwatches />
      <TypographyTokens />
    </div>
  );
}
