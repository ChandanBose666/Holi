'use client';

interface PreviewProps {
  css: string;
  error: string | null;
}

const SAMPLE_HTML = `
<div style="padding:32px;display:flex;flex-direction:column;gap:20px;align-items:flex-start;font-family:'Inter',-apple-system,sans-serif">
  <div>
    <p style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:10px">Buttons</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <button class="btn btn-primary">Primary</button>
      <button class="btn btn-ghost">Ghost</button>
    </div>
  </div>
  <div>
    <p style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:10px">Card</p>
    <div class="card" style="max-width:260px">
      <p style="font-size:0.9rem;font-weight:600;color:#1e293b;margin-bottom:6px">Component preview</p>
      <p style="font-size:0.8rem;color:#64748b;margin-bottom:14px">Styled by your Holi config.</p>
      <button class="btn btn-primary" style="font-size:0.8rem">Get started →</button>
    </div>
  </div>
</div>
`;

function buildSrcDoc(css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f8fafc; }
  ${css}
</style>
</head>
<body>${SAMPLE_HTML}</body>
</html>`;
}

export function Preview({ css, error }: PreviewProps) {
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div>
          <p style={{ color: '#F87171', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            Config error — fix the JSON to see the preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={buildSrcDoc(css)}
      className="preview-iframe"
      title="Component preview"
      sandbox="allow-same-origin"
    />
  );
}
