import { compileFromObject, DEFAULT_CONFIG } from '@holi.dev/core';
import { codeToHtml } from 'shiki';

interface ComponentCardProps {
  name: string;
}

function buildSrcDoc(name: string, css: string, variants: string[]): string {
  const buttons = variants
    .map(
      (v) =>
        `<button class="${name} ${name}-${v}" style="margin:4px">${v}</button>`,
    )
    .join('');

  const html =
    name === 'card'
      ? `<div class="card" style="max-width:220px">
          <p style="font-weight:600;color:#1e293b;margin-bottom:6px;font-size:0.9rem">Card component</p>
          <p style="color:#64748b;font-size:0.8rem">Compiled by Holi.</p>
        </div>`
      : `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${buttons}</div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { display:flex;align-items:center;justify-content:center;min-height:100%;
         padding:20px;background:#F8FAFC;font-family:'Inter',-apple-system,sans-serif; }
  ${css}
</style>
</head>
<body>${html}</body>
</html>`;
}

export async function ComponentCard({ name }: ComponentCardProps) {
  const result = compileFromObject(DEFAULT_CONFIG);
  const componentCSS = result[`${name}.css`] ?? '';
  const component = DEFAULT_CONFIG.components?.[name];
  if (!component) return null;

  const variants = Object.keys(component.variants ?? {});
  const codeStr = componentCSS.trim();
  const codeHtml = await codeToHtml(codeStr, {
    lang: 'css',
    theme: 'github-dark-dimmed',
  });

  const srcDoc = buildSrcDoc(name, componentCSS, variants);

  return (
    <div className="component-card">
      <div className="component-card-header">
        <span className="component-card-name">.{name}</span>
        <div className="variant-chips">
          {variants.map((v) => (
            <span key={v} className="variant-chip">.{name}-{v}</span>
          ))}
        </div>
      </div>
      <iframe
        srcDoc={srcDoc}
        className="component-preview"
        title={`${name} preview`}
        sandbox="allow-same-origin"
      />
      <div className="component-code">
        <div dangerouslySetInnerHTML={{ __html: codeHtml }} />
      </div>
    </div>
  );
}
