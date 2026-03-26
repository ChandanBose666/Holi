import { codeToHtml } from 'shiki';
import { CopyButton } from '@/components/ui/CopyButton';

interface Integration {
  name: string;
  icon: string;
  code: string;
  lang: string;
}

const INTEGRATIONS: Integration[] = [
  {
    name: 'Next.js',
    icon: '▲',
    lang: 'json',
    code: `// package.json — prebuild hook runs Holi before next build
{
  "scripts": {
    "prebuild": "holi build --config holi.config.json",
    "build": "next build",
    "dev": "holi build --watch & next dev"
  }
}`,
  },
  {
    name: 'Vite',
    icon: '⚡',
    lang: 'typescript',
    code: `// vite.config.ts — run holi before the dev server starts
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

export default defineConfig({
  plugins: [{
    name: 'holi',
    buildStart() { execSync('holi build --config holi.config.json'); },
  }],
});`,
  },
  {
    name: 'Astro',
    icon: '🚀',
    lang: 'typescript',
    code: `// astro.config.mjs — holi integration
import { defineConfig } from 'astro/config';
import { execSync } from 'child_process';

export default defineConfig({
  integrations: [{
    name: 'holi',
    hooks: {
      'astro:build:start': () => execSync('holi build'),
    },
  }],
});`,
  },
  {
    name: 'Any framework',
    icon: '◈',
    lang: 'bash',
    code: `# Works anywhere that runs CSS
# Add to your build script:
holi build --config holi.config.json

# Or watch during development:
holi build --watch

# Output: holi-dist/btn.css, card.css, tokens.css…`,
  },
];

export async function Integrations() {
  const highlighted = await Promise.all(
    INTEGRATIONS.map((i) =>
      codeToHtml(i.code, { lang: i.lang, theme: 'github-dark-dimmed' }),
    ),
  );

  return (
    <section className="integrations-section">
      <div className="container">
        <div className="section-label">Integrations</div>
        <h2 className="section-title">Works with your stack</h2>
        <p className="section-sub">
          Holi is a CLI tool — it runs before your framework's build step.
          No plugins, no adapters, no lock-in.
        </p>
        <div className="integrations-grid" style={{ marginTop: 56 }}>
          {INTEGRATIONS.map((intg, i) => (
            <div key={intg.name} className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">{intg.icon}</span>
                <span className="integration-name">{intg.name}</span>
                <div style={{ marginLeft: 'auto' }}>
                  <CopyButton text={intg.code} />
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: highlighted[i] }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
