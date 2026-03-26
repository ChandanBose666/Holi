'use client';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        padding: 20,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        color: 'var(--muted)',
      }}
    >
      Loading editor…
    </div>
  ),
});

interface ConfigEditorProps {
  value: string;
  onChange: (v: string) => void;
}

export function ConfigEditor({ value, onChange }: ConfigEditorProps) {
  return (
    <MonacoEditor
      height="100%"
      language="json"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineHeight: 22,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        folding: true,
        tabSize: 2,
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'gutter',
        colorDecorators: true,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
      }}
    />
  );
}
