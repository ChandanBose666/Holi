import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { compileAndWrite } from '@holi/core';

export function watch(configPath: string): void {
  const absPath = path.resolve(process.cwd(), configPath);
  console.log(chalk.cyan(`Watching ${configPath} for changes...`));

  const watcher = chokidar.watch(absPath, { ignoreInitial: false });
  let debounce: ReturnType<typeof setTimeout>;

  const rebuild = () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const start = Date.now();
      try {
        await compileAndWrite(absPath);
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
