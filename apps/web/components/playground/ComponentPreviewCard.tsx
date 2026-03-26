'use client';
import { useState } from 'react';
import { TokenEditorPopup } from './TokenEditorPopup';
import type { TokenUsage } from '@/lib/tokenUsage';

interface ComponentPreviewCardProps {
  componentName: string;
  variants: string[];
  css: string;
  tokenUsage: TokenUsage[];
  onChangeToken: (tokenPath: string, newValue: string) => void;
}

function buildVariantHTML(componentName: string, variant: string): string {
  if (componentName === 'card') {
    return `<div class="card" style="max-width:220px">
      <p style="font-weight:600;color:#1e293b;margin-bottom:6px;font-size:0.9rem">Card component</p>
      <p style="color:#64748b;font-size:0.8rem;margin-bottom:14px">Styled by your Holi config.</p>
      <button class="btn btn-primary" style="font-size:0.8rem">Get started</button>
    </div>`;
  }
  return `<div style="display:flex;gap:8px;align-items:center">
    <button class="${componentName} ${componentName}-${variant}">${variant}</button>
  </div>`;
}

function buildBaseHTML(componentName: string, variants: string[]): string {
  if (componentName === 'card') {
    return buildVariantHTML('card', '');
  }
  const buttons = variants
    .map((v) => `<button class="${componentName} ${componentName}-${v}">${v}</button>`)
    .join('');
  return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${buttons}</div>`;
}

export function ComponentPreviewCard({
  componentName,
  variants,
  css,
  tokenUsage,
  onChangeToken,
}: ComponentPreviewCardProps) {
  const [active, setActive] = useState<string>(variants[0] ?? '');
  const [showEditor, setShowEditor] = useState(false);

  const html = variants.length > 0
    ? buildVariantHTML(componentName, active)
    : buildBaseHTML(componentName, variants);

  return (
    <div className="pg-preview-card">
      <div className="pg-preview-card-header">
        <span className="pg-preview-card-name">.{componentName}</span>
        {variants.length > 0 && (
          <div className="variant-pills" style={{ gap: 4 }}>
            {variants.map((v) => (
              <button
                key={v}
                className={`variant-pill${active === v ? ' variant-pill--active' : ''}`}
                style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                onClick={() => setActive(v)}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        <button
          className="pg-inspect-btn"
          onClick={() => setShowEditor((s) => !s)}
          title="Edit tokens"
        >
          {showEditor ? '✕' : '⚙ tokens'}
        </button>
      </div>

      <div className="component-preview-area">
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {showEditor && tokenUsage.length > 0 && (
        <TokenEditorPopup
          componentName={componentName}
          tokens={tokenUsage}
          onChangeToken={onChangeToken}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
