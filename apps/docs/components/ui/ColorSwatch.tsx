import { DEFAULT_CONFIG } from '@holi.dev/core';

interface ColorSwatchProps {
  name: string;
  hex:  string;
}

export function ColorSwatch({ name, hex }: ColorSwatchProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-16 w-16 rounded-xl shadow-sm ring-1 ring-black/5"
        style={{ background: hex }}
        title={hex}
      />
      <span className="text-xs font-semibold text-fd-foreground">{name}</span>
      <span className="font-mono text-[10px] text-fd-muted-foreground">{hex}</span>
    </div>
  );
}

export function ColorSwatchGrid() {
  const colors = DEFAULT_CONFIG.tokens?.color ?? {};
  return (
    <div className="my-6 flex flex-wrap gap-6">
      {Object.entries(colors).map(([name, hex]) => (
        <ColorSwatch key={name} name={name} hex={String(hex)} />
      ))}
    </div>
  );
}
