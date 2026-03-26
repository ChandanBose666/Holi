import { codeToHtml } from 'shiki';
import { DEFAULT_CONFIG, compileFromObject } from '@holi.dev/core';
import { CodeSplitTabs } from '@/components/landing/CodeSplitTabs';

const CONFIG_CODE = JSON.stringify(
  {
    tokens: DEFAULT_CONFIG.tokens,
    breakpoints: DEFAULT_CONFIG.breakpoints,
    components: DEFAULT_CONFIG.components,
    animations: DEFAULT_CONFIG.animations,
    output: { outputDir: 'holi-dist', utilities: true },
  },
  null,
  2,
);

const CLI_CODE = `# Install the CLI
npm install -g @holi.dev/cli

# Build from config
holi build --config holi.config.json

# Watch mode (re-builds on change)
holi build --watch`;

const HTML_CODE = `<!-- Use semantic class names in any framework -->
<button class="btn btn-primary">
  Get started
</button>

<button class="btn btn-ghost">
  Learn more
</button>

<div class="card">
  <h2>Your component</h2>
  <p>Styled by Holi — no JS needed.</p>
</div>`;

export async function CodeSplit() {
  const result = compileFromObject(DEFAULT_CONFIG);
  const cssOutput = Object.entries(result)
    .filter(([k]) => k !== 'utilities.css')
    .map(([k, v]) => `/* ${k} */\n${v}`)
    .join('\n');

  const [configHtml, cssHtml, cliHtml, htmlHtml] = await Promise.all([
    codeToHtml(CONFIG_CODE, { lang: 'json', theme: 'github-dark-dimmed' }),
    codeToHtml(cssOutput.trim(), { lang: 'css', theme: 'github-dark-dimmed' }),
    codeToHtml(CLI_CODE, { lang: 'bash', theme: 'github-dark-dimmed' }),
    codeToHtml(HTML_CODE, { lang: 'html', theme: 'github-dark-dimmed' }),
  ]);

  const tabs = [
    { label: 'holi.config.json', code: CONFIG_CODE, html: configHtml },
    { label: 'output.css', code: cssOutput, html: cssHtml },
    { label: 'usage.html', code: HTML_CODE, html: htmlHtml },
    { label: 'CLI', code: CLI_CODE, html: cliHtml },
  ];

  return (
    <section className="code-split-section">
      <div className="container">
        <div className="code-split-layout">
          <div className="code-split-desc">
            <div className="section-label">How it works</div>
            <h2 className="section-title">Write config. Get CSS. Ship it.</h2>
            <div className="code-split-steps">
              <div className="step">
                <div className="step-num">1</div>
                <div>
                  <div className="step-title">Define your design system</div>
                  <p className="step-desc">
                    Write tokens, components, animations and breakpoints in
                    a single <code>holi.config.json</code>. Reference tokens
                    by name — <code>color.primary</code>, <code>spacing.md</code>.
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div>
                  <div className="step-title">Run holi build</div>
                  <p className="step-desc">
                    The CLI parses your config, resolves all token references
                    to their values, and emits one CSS file per component plus
                    a <code>tokens.css</code> and utility classes.
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div>
                  <div className="step-title">Use semantic classes in HTML</div>
                  <p className="step-desc">
                    Link the output CSS and use <code>.btn-primary</code>,{' '}
                    <code>.card</code> in any framework — no JS runtime,
                    no build plugin required.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CodeSplitTabs tabs={tabs} />
        </div>
      </div>
    </section>
  );
}
