import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function PlaygroundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-fd-background">
      <Header />
      <main className="flex flex-1 items-center justify-center text-center px-4">
        <div>
          <p className="mb-2 text-4xl font-bold text-fd-foreground">Playground</p>
          <p className="mb-6 text-fd-muted-foreground">Coming soon — an interactive Holi config editor.</p>
          <Link href="/docs/getting-started" className="text-sm font-medium text-[#6366f1] hover:underline">
            ← Back to docs
          </Link>
        </div>
      </main>
    </div>
  );
}
