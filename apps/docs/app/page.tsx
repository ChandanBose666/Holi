import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const colorTokens = [
  { name: 'primary',    hex: '#6366F1' },
  { name: 'primary-dk', hex: '#4F46E5' },
  { name: 'surface',    hex: '#F8FAFC' },
  { name: 'text',       hex: '#1E293B' },
  { name: 'muted',      hex: '#64748B' },
];

const quickStartSteps = [
  'npm install -g holi',
  'holi init',
  'holi build',
  '# → holi-dist/ with your CSS',
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-fd-background text-fd-foreground">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-screen-lg px-4 py-24 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-accent px-3 py-1 text-xs font-medium text-[#6366f1]">
            Zero runtime · Pure CSS output
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
            CSS generation,{' '}
            <span className="text-[#6366f1]">one config away</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-fd-muted-foreground">
            Define your design tokens, components, and animations in a single JSON file.
            Holi compiles them into pure, static CSS — no JavaScript runtime, no build plugins required.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/docs/getting-started"
              className="rounded-lg bg-[#6366f1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4f46e5] transition-colors"
            >
              Get started →
            </Link>
            <a
              href="https://github.com/ChandanBose666/Holi"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium text-fd-muted-foreground hover:bg-fd-accent transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* Live Token Swatch Strip */}
        <section className="border-y border-fd-border bg-fd-card py-12">
          <div className="mx-auto max-w-screen-lg px-4">
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-fd-muted-foreground">
              Live token output — compiled from your config
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {colorTokens.map(({ name, hex }) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <div
                    className="h-14 w-14 rounded-xl shadow-sm ring-1 ring-black/5"
                    style={{ background: hex }}
                  />
                  <span className="text-xs font-medium text-fd-muted-foreground">{name}</span>
                  <span className="font-mono text-[10px] text-fd-muted-foreground/70">{hex}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="mx-auto max-w-screen-lg px-4 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Holi?</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Zero Runtime',
                desc:  'Holi runs at build time and outputs plain .css files. No JavaScript executes in the browser.',
              },
              {
                title: 'One Config',
                desc:  'A single holi.config.json defines every token, component, animation, and breakpoint.',
              },
              {
                title: 'Pure CSS',
                desc:  'The output is standard CSS — works with any framework, any bundler, or just a <link> tag.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-fd-border bg-fd-card p-6">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/10">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#6366f1]" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="text-sm text-fd-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick start */}
        <section className="bg-fd-card border-y border-fd-border py-20">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="mb-8 text-center text-3xl font-bold">Up in 60 seconds</h2>
            <div className="rounded-xl bg-[#0f172a] p-6 font-mono text-sm">
              {quickStartSteps.map((code, i) => (
                <div key={i} className="flex items-start gap-3 py-1">
                  <span className="select-none text-slate-500">{String(i + 1).padStart(2, ' ')}</span>
                  <span className={code.startsWith('#') ? 'text-slate-500' : 'text-[#a5b4fc]'}>
                    {code}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/docs/getting-started" className="text-sm font-medium text-[#6366f1] hover:underline">
                Full installation guide →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
