interface ConfigExampleProps {
  json:   string;
  label?: string;
}

export function ConfigExample({ json, label }: ConfigExampleProps) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-fd-border">
      {label && (
        <div className="border-b border-fd-border bg-fd-card px-4 py-1.5 text-xs font-medium text-fd-muted-foreground">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto bg-[#0f172a] p-4 text-xs text-slate-300">
        <code>{json}</code>
      </pre>
    </div>
  );
}
