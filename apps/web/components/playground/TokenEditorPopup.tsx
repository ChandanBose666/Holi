'use client';
import type { TokenUsage } from '@/lib/tokenUsage';

interface TokenEditorPopupProps {
  componentName: string;
  tokens: TokenUsage[];
  onChangeToken: (tokenPath: string, newValue: string) => void;
  onClose: () => void;
}

export function TokenEditorPopup({
  componentName,
  tokens,
  onChangeToken,
  onClose,
}: TokenEditorPopupProps) {
  return (
    <div className="token-editor-popup">
      <div className="token-editor-header">
        <span className="token-editor-title">.{componentName} tokens</span>
        <button className="token-editor-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="token-editor-rows">
        {tokens.map(({ tokenPath, resolvedValue, type }) => (
          <div key={tokenPath} className="token-editor-row">
            <span className="token-editor-label">{tokenPath}</span>
            {type === 'color' ? (
              <div className="token-editor-color-wrap">
                <input
                  type="color"
                  value={resolvedValue.startsWith('#') ? resolvedValue : '#000000'}
                  onChange={(e) => onChangeToken(tokenPath, e.target.value)}
                  className="token-editor-color-input"
                  title={resolvedValue}
                />
                <span className="token-editor-value">{resolvedValue}</span>
              </div>
            ) : type === 'spacing' || type === 'radius' ? (
              <div className="token-editor-range-wrap">
                <input
                  type="range"
                  min={0}
                  max={type === 'spacing' ? 64 : 32}
                  step={1}
                  value={parseInt(resolvedValue) || 0}
                  onChange={(e) => onChangeToken(tokenPath, `${e.target.value}px`)}
                  className="token-editor-range"
                />
                <span className="token-editor-value">{resolvedValue}</span>
              </div>
            ) : (
              <span className="token-editor-value">{resolvedValue}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
