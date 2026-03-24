'use client';

interface LiveDemoProps {
  html:    string;
  height?: number;
  label?:  string;
}

export function LiveDemo({ html, height = 80, label }: LiveDemoProps) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-fd-border">
      {label && (
        <div className="border-b border-fd-border bg-fd-card px-4 py-1.5 text-xs font-medium text-fd-muted-foreground">
          {label}
        </div>
      )}
      <div className="bg-fd-background p-4">
        <div
          style={{ minHeight: height }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
