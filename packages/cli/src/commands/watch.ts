import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { compileAndWrite } from '@holi.dev/core';

const CONFIG_CANDIDATES = [
  'holi.config.ts',
  'holi.config.js',
  'holi.config.mjs',
  'holi.config.json',
  'holi.json',
];

export function watch(configPathOrCwd: string): void {
  const cwd = path.resolve(process.cwd(), configPathOrCwd);
  const watchPaths = CONFIG_CANDIDATES.map((f) => path.resolve(cwd, f));

  console.log(chalk.cyan(`Watching for config changes in ${cwd}...`));

  const watcher = chokidar.watch(watchPaths, { ignoreInitial: false, persistent: true });
  let debounce: ReturnType<typeof setTimeout>;

  const rebuild = () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const start = Date.now();
      try {
        await compileAndWrite(cwd);
        console.log(chalk.green(`✓ Rebuilt in ${Date.now() - start}ms`));
      } catch (e: unknown) {
        console.error(chalk.red(`✗ ${(e as Error).message}`));
      }
    }, 50);
  };

  watcher.on('add', rebuild);
  watcher.on('change', rebuild);
  watcher.on('error', (err) => console.error(chalk.red('Watcher error:', err)));
}
