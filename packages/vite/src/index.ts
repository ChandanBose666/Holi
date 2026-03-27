import type { Plugin, ViteDevServer } from 'vite';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { loadConfig, resolve, emit } from '@holi.dev/core';

const CONFIG_CANDIDATES = [
  'holi.config.ts',
  'holi.config.js',
  'holi.config.mjs',
  'holi.config.json',
  'holi.json',
];

async function runCompile(cwd: string): Promise<void> {
  const config = await loadConfig(cwd);
  const mode = config.output?.mode ?? 'inline';
  const result = emit(resolve(config, mode));
  const outDir = path.resolve(cwd, config.output?.outputDir ?? 'holi-dist');
  await mkdir(outDir, { recursive: true });
  for (const [filename, css] of Object.entries(result)) {
    if (css.trim()) await writeFile(path.join(outDir, filename), css, 'utf-8');
  }
}

export function holiPlugin(cwd = process.cwd()): Plugin {
  return {
    name: 'vite-plugin-holi',

    async buildStart() {
      await runCompile(cwd);
    },

    configureServer(server: ViteDevServer) {
      const watched = CONFIG_CANDIDATES.map(f => path.resolve(cwd, f));
      for (const filePath of watched) {
        server.watcher.add(filePath);
      }
      server.watcher.on('change', async (changed: string) => {
        if (watched.includes(changed)) {
          try {
            await runCompile(cwd);
            server.ws.send({ type: 'full-reload' });
          } catch (err) {
            server.config.logger.error(`[holi] ${String(err)}`);
          }
        }
      });
    },
  };
}
