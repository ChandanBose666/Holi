'use client';

interface CSSOutputProps {
  css: string;
  error: string | null;
}

export function CSSOutput({ css, error }: CSSOutputProps) {
  if (error) {
    return <div className="css-output-error">⚠ {error}</div>;
  }

  return <pre className="css-output-pre">{css || '/* No output yet */'}</pre>;
}
