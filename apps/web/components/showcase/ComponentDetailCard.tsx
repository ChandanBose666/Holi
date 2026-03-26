import { compileFromObject, DEFAULT_CONFIG } from '@holi.dev/core';
import { codeToHtml } from 'shiki';
import { extractTokenUsage } from '@/lib/tokenUsage';
import { VariantSwitcher } from './VariantSwitcher';

interface ComponentDetailCardProps {
  name: string;
}

function buildVariantHTML(componentName: string, variant: string): string {
  if (componentName === 'card') {
    return `<div class="card" style="max-width:220px">
      <p style="font-weight:600;color:#1e293b;margin-bottom:6px;font-size:0.9rem">Card component</p>
      <p style="color:#64748b;font-size:0.8rem">Compiled by Holi.</p>
    </div>`;
  }
  return `<div style="display:flex;gap:8px;align-items:center">
    <button class="${componentName} ${componentName}-${variant}">${variant}</button>
  </div>`;
}

function buildBaseHTML(componentName: string): string {
  if (componentName === 'card') {
    return `<div class="card" style="max-width:220px">
      <p style="font-weight:600;color:#1e293b;margin-bottom:6px;font-size:0.9rem">Card component</p>
      <p style="color:#64748b;font-size:0.8rem">Compiled by Holi.</p>
    </div>`;
  }
  const variants = Object.keys(DEFAULT_CONFIG.components?.[componentName]?.variants ?? {});
  const buttons = variants
    .map((v) => `<button class="${componentName} ${componentName}-${v}">${v}</button>`)
    .join('');
  return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${buttons}</div>`;
}

function addTokenComments(css: string, tokenUsage: { tokenPath: string; resolvedValue: string }[]): string {
  let result = css;
  for (const { tokenPath, resolvedValue } of tokenUsage) {
    // Avoid double-annotating
    if (result.includes(`/* ${tokenPath} */`)) continue;
    result = result.replaceAll(resolvedValue, `${resolvedValue} /* ${tokenPath} */`);
  }
  return result;
}

export async function ComponentDetailCard({ name }: ComponentDetailCardProps) {
  const component = DEFAULT_CONFIG.components?.[name];
  if (!component) return null;

  const result = compileFromObject(DEFAULT_CONFIG);
  const componentCSS = result[`${name}.css`] ?? '';
  const variants = Object.keys(component.variants ?? {});
  const tokenUsage = extractTokenUsage(DEFAULT_CONFIG, name);

  const annotatedCSS = addTokenComments(componentCSS, tokenUsage);
  const codeHtml = await codeToHtml(annotatedCSS.trim(), {
    lang: 'css',
    theme: 'github-dark-dimmed',
  });

  const variantPreviews: Record<string, string> = {};
  for (const v of variants) {
    variantPreviews[v] = buildVariantHTML(name, v);
  }

  return (
    <div className="detail-card">
      {/* Client island — header + variant pills + live preview */}
      <VariantSwitcher
        componentName={name}
        variants={variants}
        css={componentCSS}
        variantPreviews={variantPreviews}
        basePreview={buildBaseHTML(name)}
      />

      {/* Token origin strip */}
      {tokenUsage.length > 0 && (
        <div className="token-origin-strip">
          {tokenUsage.map(({ tokenPath, resolvedValue, type }) => (
            <span key={tokenPath} className="token-origin-chip">
              {type === 'color' && (
                <span
                  className="token-origin-swatch"
                  style={{ background: resolvedValue }}
                />
              )}
              {tokenPath}
            </span>
          ))}
        </div>
      )}

      {/* Annotated compiled CSS */}
      <div className="detail-card-code">
        <div dangerouslySetInnerHTML={{ __html: codeHtml }} />
      </div>
    </div>
  );
}
