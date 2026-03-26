'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { compileFromObject, DEFAULT_CONFIG } from '@holi.dev/core';
import type { HoliConfig } from '@holi.dev/shared';
import { ConfigEditor } from '@/components/playground/ConfigEditor';
import { CSSOutput } from '@/components/playground/CSSOutput';
import { ComponentPreviewCard } from '@/components/playground/ComponentPreviewCard';
import { extractTokenUsage } from '@/lib/tokenUsage';

// ─── Presets ────────────────────────────────────────────────────────────────

const PRESETS: Record<string, HoliConfig> = {
  Full: DEFAULT_CONFIG,
  Minimal: {
    tokens: {
      color:   { primary: '#000000', surface: '#ffffff', muted: '#6b7280' },
      spacing: { sm: '8px', md: '16px', lg: '24px' },
      radius:  { md: '4px' },
    },
    components: {
      btn: {
        base: {
          display: 'inline-flex',
          padding: 'spacing.sm spacing.md',
          'border-radius': 'radius.md',
          cursor: 'pointer',
          'font-weight': '600',
        },
        variants: {
          primary: { background: 'color.primary', color: '#ffffff' },
        },
      },
    },
    output: { utilities: false },
  },
  'Dark theme': {
    tokens: {
      color:   { primary: '#818CF8', 'primary-dk': '#6366F1', surface: '#1e1b4b', text: '#e0e7ff', muted: '#a5b4fc' },
      spacing: { xs: '4px', sm: '8px', md: '16px', lg: '32px' },
      radius:  { sm: '4px', md: '8px', lg: '16px' },
    },
    components: {
      btn: {
        base: {
          display: 'inline-flex',
          padding: 'spacing.sm spacing.md',
          'border-radius': 'radius.md',
          cursor: 'pointer',
        },
        variants: {
          primary: { background: 'color.primary', color: 'color.surface' },
          ghost:   { background: 'transparent', border: '1px solid color.primary', color: 'color.primary' },
        },
      },
      card: {
        base: {
          background: 'color.surface',
          'border-radius': 'radius.lg',
          padding: 'spacing.lg',
        },
      },
    },
    output: { utilities: true },
  },
  Brutalist: {
    tokens: {
      color:   { primary: '#FF0000', surface: '#FFFFFF', text: '#000000' },
      spacing: { sm: '8px', md: '16px', lg: '32px' },
      radius:  { sm: '0px', md: '0px', lg: '0px' },
    },
    components: {
      btn: {
        base: {
          display: 'inline-flex',
          padding: 'spacing.sm spacing.md',
          'border-radius': 'radius.md',
          cursor: 'pointer',
          'font-weight': '900',
          border: '3px solid #000000',
          'text-transform': 'uppercase',
          'letter-spacing': '0.05em',
        },
        variants: {
          primary: { background: 'color.primary', color: 'color.text' },
          ghost:   { background: 'color.surface',  color: 'color.text' },
        },
      },
      card: {
        base: {
          background: 'color.surface',
          'border-radius': 'radius.lg',
          padding: 'spacing.lg',
          border: '3px solid #000000',
        },
      },
    },
    output: { utilities: false },
  },
};

const PRESET_NAMES = Object.keys(PRESETS) as Array<keyof typeof PRESETS>;

// ─── Compile helpers ─────────────────────────────────────────────────────────

function addTokenComments(css: string, config: HoliConfig): string {
  let result = css;
  for (const [category, map] of Object.entries(config.tokens)) {
    if (!map) continue;
    for (const [name, value] of Object.entries(map)) {
      const comment = `/* ${category}.${name} */`;
      if (result.includes(comment)) continue;
      result = result.replaceAll(value, `${value} ${comment}`);
    }
  }
  return result;
}

function compile(configStr: string): {
  files: Record<string, string>;
  annotatedFiles: Record<string, string>;
  configObj: HoliConfig | null;
  error: string | null;
} {
  try {
    const configObj = JSON.parse(configStr) as HoliConfig;
    const raw = compileFromObject(configObj);
    const files: Record<string, string> = {};
    const annotatedFiles: Record<string, string> = {};
    for (const [filename, css] of Object.entries(raw)) {
      files[filename] = css;
      annotatedFiles[filename] = addTokenComments(css, configObj);
    }
    return { files, annotatedFiles, configObj, error: null };
  } catch (e) {
    return { files: {}, annotatedFiles: {}, configObj: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ─── URL encode/decode ────────────────────────────────────────────────────────

function encodeConfig(s: string): string {
  try { return btoa(unescape(encodeURIComponent(s))); } catch { return ''; }
}

function decodeConfig(s: string): string | null {
  try { return decodeURIComponent(escape(atob(s))); } catch { return null; }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PlaygroundLayout() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activePreset, setActivePreset] = useState<string>('Full');
  const [configStr, setConfigStr] = useState<string>(() => {
    const c = searchParams.get('c');
    if (c) { const decoded = decodeConfig(c); if (decoded) return decoded; }
    return JSON.stringify(DEFAULT_CONFIG, null, 2);
  });

  const [output, setOutput] = useState(() => compile(configStr));
  const [copied, setCopied] = useState(false);

  useEffect(() => { setOutput(compile(configStr)); }, [configStr]);

  const loadPreset = useCallback((name: string) => {
    setActivePreset(name);
    setConfigStr(JSON.stringify(PRESETS[name], null, 2));
    router.replace('/playground');
  }, [router]);

  const handleReset = useCallback(() => {
    loadPreset(activePreset);
  }, [loadPreset, activePreset]);

  const handleShare = useCallback(async () => {
    const encoded = encodeConfig(configStr);
    const url = `${window.location.origin}/playground?c=${encoded}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    router.replace(`/playground?c=${encoded}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [configStr, router]);

  const handleDownload = useCallback(() => {
    const allCSS = Object.values(output.files).join('\n\n');
    const blob = new Blob([allCSS], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'holi-output.css';
    a.click();
    URL.revokeObjectURL(url);
  }, [output.files]);

  const handleCopyAll = useCallback(async () => {
    const allCSS = Object.values(output.files).join('\n\n');
    await navigator.clipboard.writeText(allCSS).catch(() => {});
  }, [output.files]);

  // Token editor: update a token value in the config string
  const handleChangeToken = useCallback((tokenPath: string, newValue: string) => {
    try {
      const obj = JSON.parse(configStr) as HoliConfig;
      const [category, name] = tokenPath.split('.');
      if (obj.tokens[category]) {
        (obj.tokens[category] as Record<string, string>)[name] = newValue;
        setConfigStr(JSON.stringify(obj, null, 2));
      }
    } catch { /* ignore parse errors */ }
  }, [configStr]);

  const { files, annotatedFiles, configObj, error } = output;
  const componentNames = configObj ? Object.keys(configObj.components ?? {}) : [];

  return (
    <div className="playground-page">
      {/* Header */}
      <div className="playground-header">
        <span className="playground-title">
          <a href="/" style={{ color: 'var(--text-2)', marginRight: 8 }}>holi</a>
          / playground
        </span>

        {/* Preset pills */}
        <div className="preset-pills">
          {PRESET_NAMES.map((name) => (
            <button
              key={name}
              className={`preset-pill${activePreset === name ? ' preset-pill--active' : ''}`}
              onClick={() => loadPreset(name)}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {!error && (
            <>
              <button onClick={handleDownload} className="playground-share-btn" title="Download CSS">
                ⬇ Download
              </button>
              <button onClick={handleCopyAll} className="playground-share-btn" title="Copy all CSS">
                📋 Copy all
              </button>
            </>
          )}
          <button onClick={handleReset} className="playground-share-btn">Reset</button>
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

        {/* Panel 2: CSS output with file tabs */}
        <div className="playground-pane">
          <div className="pane-header">
            <span className="pane-title">output.css</span>
            {!error && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--green)' }}>
                ✓ compiled
              </span>
            )}
          </div>
          <div className="pane-body" style={{ display: 'flex', flexDirection: 'column' }}>
            <CSSOutput files={annotatedFiles} error={error} />
          </div>
        </div>

        {/* Panel 3: Per-component preview */}
        <div className="playground-pane">
          <div className="pane-header">
            <span className="pane-title">preview</span>
          </div>
          <div className="pane-body">
            {error ? (
              <div style={{ padding: 20, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#F87171' }}>
                Config error — fix the JSON to see the preview
              </div>
            ) : (
              <div className="pg-preview-list">
                {componentNames.map((name) => {
                  const comp = (configObj!.components ?? {})[name];
                  const variants = Object.keys(comp?.variants ?? {});
                  const componentCSS = files[`${name}.css`] ?? '';
                  const tokenUsage = extractTokenUsage(configObj!, name);
                  return (
                    <ComponentPreviewCard
                      key={name}
                      componentName={name}
                      variants={variants}
                      css={componentCSS}
                      tokenUsage={tokenUsage}
                      onChangeToken={handleChangeToken}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
