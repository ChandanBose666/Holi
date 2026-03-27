import type { PluginCreator, Root } from 'postcss';
import postcss from 'postcss';
import { loadConfig, resolve, emit } from '@holi.dev/core';

const holiPostcss: PluginCreator<{ cwd?: string }> = (opts = {}) => ({
  postcssPlugin: 'postcss-holi',

  async Once(root: Root) {
    const cwd = opts.cwd ?? process.cwd();
    const config = await loadConfig(cwd);
    const mode = config.output?.mode ?? 'inline';
    const result = emit(resolve(config, mode));

    const cssChunks: string[] = [];
    for (const [, css] of Object.entries(result)) {
      if (css.trim()) cssChunks.push(css);
    }

    if (cssChunks.length > 0) {
      const combined = cssChunks.join('\n');
      const parsed = postcss.parse(combined);
      parsed.nodes.forEach(node => root.prepend(node.clone()));
    }
  },
});

holiPostcss.postcss = true;

export default holiPostcss;
