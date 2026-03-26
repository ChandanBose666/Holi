'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { compileFromObject } from '@holi.dev/core';
import { DEFAULT_CONFIG } from '@holi.dev/core';
import { ConfigEditor } from '@/components/playground/ConfigEditor';
import { CSSOutput } from '@/components/playground/CSSOutput';
import { Preview } from '@/components/playground/Preview';

const DEFAULT_VALUE = JSON.stringify(DEFAULT_CONFIG, null, 2);

function encodeConfig(s: string): string {
  try {
    return btoa(unescape(encodeURIComponent(s)));
  } catch {
    return '';
  }
}

function decodeConfig(s: string): string | null {
  try {
    return decodeURIComponent(escape(atob(s)));
  } catch {
    return null;
  }
}

function compile(configStr: string): { css: string; error: string | null } {
  try {
    const raw = JSON.parse(configStr);
    const result = compileFromObject(raw);
    const css = Object.values(result).join('\n\n');
    return { css, error: null };
  } catch (e) {
    return { css: '', error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export function PlaygroundLayout() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [configStr, setConfigStr] = useState<string>(() => {
    const c = searchParams.get('c');
    if (c) {
      const decoded = decodeConfig(c);
      if (decoded) return decoded;
    }
    return DEFAULT_VALUE;
  });

  const [{ css, error }, setOutput] = useState(() => compile(configStr));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOutput(compile(configStr));
  }, [configStr]);

  const handleShare = useCallback(async () => {
    const encoded = encodeConfig(configStr);
    const url = `${window.location.origin}/playground?c=${encoded}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    router.replace(`/playground?c=${encoded}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [configStr, router]);

  const handleReset = useCallback(() => {
    setConfigStr(DEFAULT_VALUE);
    router.replace('/playground');
  }, [router]);

  return (
    <div className="playground-page">
      <div className="playground-header">
        <span className="playground-title">
          <a href="/" style={{ color: 'var(--text-2)', marginRight: 8 }}>holi</a>
          / playground
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleReset} className="playground-share-btn">
            Reset
          </button>
          <button onClick={handleShare} className="playground-share-btn">
            {copied ? '✓ Copied link' : '⇧ Share'}
          </button>
        </div>
      </div>

      <div className="playground-body">
        {/* Panel 1: Config editor */}
        <div className="playground-pane">
          <div className="pane-header">
            <span className="pane-title">holi.config.json</span>
          </div>
          <div className="pane-body">
            <ConfigEditor value={configStr} onChange={setConfigStr} />
          </div>
        </div>

        {/* Panel 2: CSS output */}
        <div className="playground-pane">
          <div className="pane-header">
            <span className="pane-title">output.css</span>
            {!error && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--green)',
              }}>
                ✓ compiled
              </span>
            )}
          </div>
          <div className="pane-body">
            <CSSOutput css={css} error={error} />
          </div>
        </div>

        {/* Panel 3: Preview */}
        <div className="playground-pane">
          <div className="pane-header">
            <span className="pane-title">preview</span>
          </div>
          <div className="pane-body">
            <Preview css={css} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
}
