'use client';
import { useState } from 'react';

interface VariantSwitcherProps {
  componentName: string;
  variants: string[];
  css: string;
  variantPreviews: Record<string, string>;
  basePreview: string;
}

export function VariantSwitcher({
  componentName,
  variants,
  css,
  variantPreviews,
  basePreview,
}: VariantSwitcherProps) {
  const [active, setActive] = useState<string>(variants[0] ?? '');
  const html = active ? (variantPreviews[active] ?? basePreview) : basePreview;

  return (
    <>
      <div className="detail-card-header">
        <span className="detail-card-name">.{componentName}</span>
        {variants.length > 0 && (
          <div className="variant-pills">
            {variants.map((v) => (
              <button
                key={v}
                className={`variant-pill${active === v ? ' variant-pill--active' : ''}`}
                onClick={() => setActive(v)}
              >
                .{componentName}-{v}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="component-preview-area">
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}
