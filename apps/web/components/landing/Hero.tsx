import { compileFromObject } from '@holi.dev/core';
import { codeToHtml } from 'shiki';
import { Nav } from '@/components/landing/Nav';
import type { HoliConfig } from '@holi.dev/core';

const DEMO_CONFIG: HoliConfig = {
  tokens: {
    color: { primary: '#6366F1', surface: '#F8FAFC', text: '#1E293B' },
    spacing: { sm: '8px', md: '16px' },
    radius: { md: '8px' },
  },
  components: {
    btn: {
      base: {
        display: 'inline-flex',
        padding: 'spacing.sm spacing.md',
        'border-radius': 'radius.md',
        cursor: 'pointer',
      },
      variants: {
        primary: { background: 'color.primary', color: '#fff' },
        ghost: { border: '1px solid color.primary', color: 'color.primary' },
      },
    },
  },
  output: { outputDir: 'holi-dist', utilities: false },
};

// Simplified version shown on the left panel — focuses on token references
const DISPLAY_CONFIG = `{
  "tokens": {
    "color": { "primary": "#6366F1" },
    "spacing": { "sm": "8px", "md": "16px" },
    "radius": { "md": "8px" }
  },
  "components": {
    "btn": {
      "base": {
        "padding": "spacing.sm spacing.md",
        "border-radius": "radius.md"
      },
      "variants": {
        "primary": { "background": "color.primary" }
      }
    }
  }
}`;

const FLOATERS = [
  { color: '#6366F1', size: 22, x: '3%',  y: '20%', delay: 0,    dur: 7    },
  { color: '#4F46E5', size: 14, x: '9%',  y: '72%', delay: 2.1,  dur: 9    },
  { color: '#818CF8', size: 10, x: '17%', y: '44%', delay: 4,    dur: 6    },
  { color: '#F8FAFC', size: 16, x: '22%', y: '85%', delay: 1,    dur: 8    },
  { color: '#64748B', size: 8,  x: '27%', y: '30%', delay: 5.5,  dur: 10   },
  { color: '#6366F1', size: 18, x: '72%', y: '14%', delay: 1.5,  dur: 6.5  },
  { color: '#1E293B', size: 26, x: '78%', y: '56%', delay: 3,    dur: 8.5  },
  { color: '#F8FAFC', size: 12, x: '84%', y: '78%', delay: 0.5,  dur: 7.5  },
  { color: '#4F46E5', size: 8,  x: '91%', y: '35%', delay: 4.5,  dur: 5    },
  { color: '#64748B', size: 20, x: '62%', y: '9%',  delay: 2.5,  dur: 9    },
  { color: '#6366F1', size: 10, x: '48%', y: '92%', delay: 6,    dur: 7    },
  { color: '#818CF8', size: 14, x: '36%', y: '16%', delay: 1.8,  dur: 8    },
  { color: '#1E293B', size: 18, x: '42%', y: '80%', delay: 3.5,  dur: 6    },
  { color: '#F8FAFC', size: 8,  x: '66%', y: '62%', delay: 0.8,  dur: 10   },
  { color: '#4F46E5', size: 12, x: '55%', y: '42%', delay: 5,    dur: 5.5  },
  { color: '#6366F1', size: 24, x: '94%', y: '88%', delay: 2,    dur: 7.5  },
];

export async function Hero() {
  const result = compileFromObject(DEMO_CONFIG);
  const cssOutput = (result['btn.css'] ?? '').trim();

  const [configHtml, cssHtml] = await Promise.all([
    codeToHtml(DISPLAY_CONFIG, { lang: 'json', theme: 'github-dark-dimmed' }),
    codeToHtml(cssOutput, { lang: 'css', theme: 'github-dark-dimmed' }),
  ]);

  return (
    <section className="hero">
      {/* Background */}
      <div className="hero-bg">
        <div className="hero-gradient" />
        <div className="hero-grid" />
        {FLOATERS.map((f, i) => (
          <div
            key={i}
            className="token-float"
            style={{
              width: f.size,
              height: f.size,
              background: f.color,
              left: f.x,
              top: f.y,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.dur}s`,
            }}
          />
        ))}
      </div>

      <Nav />

      <div className="hero-content">
        <div className="container">
          <div className="hero-inner">
            {/* Left: Copy */}
            <div className="hero-left">
              <div className="hero-eyebrow">
                <span className="eyebrow-dot" />
                Zero runtime · Semantic classes · Any framework
              </div>
              <h1 className="hero-headline">
                <span className="line">Design tokens.</span>
                <span className="line">Pure CSS.</span>
                <span className="line">No runtime.</span>
              </h1>
              <p className="hero-sub">
                Write your design system as a single JSON config.
                Holi compiles it to pure CSS — semantic class names,
                resolved tokens, zero JavaScript in the browser.
              </p>
              <div className="hero-actions">
                <a
                  href="https://www.npmjs.com/package/@holi.dev/cli"
                  className="btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get started <span aria-hidden>→</span>
                </a>
                <a href="/playground" className="btn-ghost">
                  Open playground
                </a>
              </div>
            </div>

            {/* Right: Code demo */}
            <div className="hero-right">
              <div className="hero-demo">
                <div className="demo-header">
                  <div className="demo-dot" />
                  <div className="demo-dot" />
                  <div className="demo-dot" />
                  <div className="demo-tab-bar">
                    <span className="demo-tab active">holi.config.json</span>
                    <span className="demo-tab">btn.css</span>
                  </div>
                </div>
                <div className="demo-panels">
                  <div className="demo-pane">
                    <div className="demo-pane-label">Input</div>
                    <div dangerouslySetInnerHTML={{ __html: configHtml }} />
                  </div>
                  <div className="demo-pane">
                    <div className="demo-pane-label">Output</div>
                    <div dangerouslySetInnerHTML={{ __html: cssHtml }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
