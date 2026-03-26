const FEATURES = [
  {
    icon: '⚡',
    title: 'Zero runtime',
    desc: 'CSS is the output. No JavaScript ships to the browser. No runtime overhead, no hydration, no bundle cost — just bytes of CSS.',
    tag: 'output: pure .css',
  },
  {
    icon: '◈',
    title: 'Semantic class names',
    desc: 'Write .btn--primary, not .bg-indigo-600.flex.px-4. Your HTML tells a story. Your teammates understand it without a decoder ring.',
    tag: '.component--variant',
  },
  {
    icon: '◉',
    title: 'Token references',
    desc: 'Define color.primary once. Reference it everywhere. Values resolve at compile time — change a token, rebuild, done.',
    tag: 'spacing.md → 16px',
  },
  {
    icon: '◻',
    title: 'Framework agnostic',
    desc: 'One CSS file. Works with Next.js, Vite, Astro, SvelteKit, plain HTML — anything that loads a stylesheet.',
    tag: 'any framework',
  },
  {
    icon: '◎',
    title: 'Single source of truth',
    desc: 'One JSON config. Tokens, components, animations, utilities — your entire design system in one auditable file.',
    tag: 'holi.config.json',
  },
  {
    icon: '◑',
    title: 'Tiny CLI',
    desc: 'One command: holi build. Outputs per-component CSS files and a unified stylesheet. CI-friendly, scriptable, fast.',
    tag: 'holi build',
  },
];

export function Features() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-label">Why Holi</div>
        <h2 className="section-title">
          A design system tool that stays out of your way
        </h2>
        <p className="section-sub">
          No runtime. No JS framework dependency. No lock-in. Just a compiler
          that turns your config into CSS.
        </p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
              <span className="feature-tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
