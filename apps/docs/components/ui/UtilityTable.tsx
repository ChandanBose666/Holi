import { compileFromObject, DEFAULT_CONFIG } from '@holi.dev/core';

interface UtilityRow {
  cls: string;
  css: string;
}

function extractUtilities(compiled: Record<string, string>): UtilityRow[] {
  const src  = compiled['utilities.css'] ?? '';
  const rows: UtilityRow[] = [];

  const ruleRe = /\.([\w-]+)\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(src)) !== null) {
    const cls          = m[1];
    const declarations = m[2]
      .split(';')
      .map(d => d.trim())
      .filter(Boolean)
      .join('; ');
    rows.push({ cls: `.${cls}`, css: declarations });
  }

  return rows.slice(0, 40);
}

export function UtilityTable() {
  const compiled = compileFromObject(DEFAULT_CONFIG);
  const rows     = extractUtilities(compiled);

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-fd-border bg-fd-card text-left">
            <th className="px-3 py-2 font-semibold text-fd-foreground">Class</th>
            <th className="px-3 py-2 font-semibold text-fd-foreground">CSS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ cls, css }) => (
            <tr key={cls} className="border-b border-fd-border hover:bg-fd-accent transition-colors">
              <td className="px-3 py-2 font-mono text-xs text-[#6366f1]">{cls}</td>
              <td className="px-3 py-2 font-mono text-xs text-fd-muted-foreground">{css}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
