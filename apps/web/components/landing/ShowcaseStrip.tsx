import { DEFAULT_CONFIG, compileFromObject } from '@holi.dev/core';

interface ShowcaseItem {
  name: string;
  cls: string;
  css: string;
  html: string;
}

function buildSrcDoc(css: string, html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 20px;
    background: #F8FAFC;
    font-family: "Inter", -apple-system, sans-serif;
  }
  ${css}
</style>
</head>
<body>${html}</body>
</html>`;
}

export function ShowcaseStrip() {
  const result = compileFromObject(DEFAULT_CONFIG);

  const btnCSS = result['btn.css'] ?? '';
  const cardCSS = result['card.css'] ?? '';
  const animCSS = result['animations.css'] ?? '';

  const items: ShowcaseItem[] = [
    {
      name: 'Primary button',
      cls: '.btn-primary',
      css: btnCSS,
      html: `<button class="btn btn-primary">Get started</button>`,
    },
    {
      name: 'Ghost button',
      cls: '.btn-ghost',
      css: btnCSS,
      html: `<button class="btn btn-ghost">Learn more</button>`,
    },
    {
      name: 'Card',
      cls: '.card',
      css: cardCSS,
      html: `<div class="card" style="width:200px">
        <p style="font-size:0.9rem;font-weight:600;margin-bottom:6px;color:#1E293B">Design System</p>
        <p style="font-size:0.8rem;color:#64748B">One config file.</p>
      </div>`,
    },
    {
      name: 'Buttons row',
      cls: '.btn-primary + .btn-ghost',
      css: btnCSS,
      html: `<div style="display:flex;gap:10px;align-items:center">
        <button class="btn btn-primary">Primary</button>
        <button class="btn btn-ghost">Ghost</button>
      </div>`,
    },
    {
      name: 'Fade-in animation',
      cls: '.animate-fade-in',
      css: animCSS,
      html: `<p class="animate-fade-in" style="font-size:1.1rem;font-weight:600;color:#1E293B">Hello, Holi ✦</p>`,
    },
    {
      name: 'Card with action',
      cls: '.card + .btn-primary',
      css: `${cardCSS}\n${btnCSS}`,
      html: `<div class="card" style="width:200px;display:flex;flex-direction:column;gap:14px">
        <p style="font-size:0.85rem;font-weight:600;color:#1E293B">Ready to ship?</p>
        <button class="btn btn-primary" style="align-self:flex-start;font-size:0.8rem">Start now →</button>
      </div>`,
    },
  ];

  return (
    <section className="showcase-section">
      <div className="showcase-label">Built with Holi · Rendered live</div>
      <div className="showcase-track-wrapper">
        <div className="showcase-track">
          {items.map((item) => (
            <div key={item.name} className="showcase-item">
              <iframe
                srcDoc={buildSrcDoc(item.css, item.html)}
                className="showcase-item-preview"
                title={item.name}
                sandbox="allow-same-origin"
              />
              <div className="showcase-item-footer">
                <div className="showcase-item-name">{item.name}</div>
                <div className="showcase-item-class">{item.cls}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
