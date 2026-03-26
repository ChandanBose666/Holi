'use client';
import { useState } from 'react';

interface CSSOutputProps {
  files: Record<string, string>;
  error: string | null;
}

export function CSSOutput({ files, error }: CSSOutputProps) {
  const fileNames = Object.keys(files);
  const [activeTab, setActiveTab] = useState<string>('');

  // Pick the active tab: use stored value if it still exists, else first key
  const currentTab = fileNames.includes(activeTab) ? activeTab : (fileNames[0] ?? '');

  if (error) {
    return <div className="css-output-error">⚠ {error}</div>;
  }

  if (fileNames.length === 0) {
    return <pre className="css-output-pre">{'/* No output yet */'}</pre>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="file-tabs">
        {fileNames.map((name) => (
          <button
            key={name}
            className={`file-tab${currentTab === name ? ' file-tab--active' : ''}`}
            onClick={() => setActiveTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <pre className="css-output-pre" style={{ flex: 1 }}>
        {files[currentTab] ?? '/* empty */'}
      </pre>
    </div>
  );
}
