import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-fd-border bg-fd-card py-8">
      <div className="mx-auto max-w-screen-xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-fd-muted-foreground">
        <p>
          Built with <span className="font-medium text-[#6366f1]">holi</span> — zero-runtime CSS.
        </p>
        <nav className="flex gap-4">
          <a
            href="https://github.com/ChandanBose666/Holi"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fd-foreground transition-colors"
          >
            GitHub
          </a>
          <Link href="/docs/getting-started" className="hover:text-fd-foreground transition-colors">
            Docs
          </Link>
        </nav>
      </div>
    </footer>
  );
}
