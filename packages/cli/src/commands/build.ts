import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { compileAndWrite } from '@holi.dev/core';

export async function build(configPathOrCwd: string): Promise<void> {
  const cwd     = path.resolve(process.cwd(), configPathOrCwd);
  const spinner = ora(`Compiling...`).start();
  const start   = Date.now();

  try {
    const result = await compileAndWrite(cwd);
    spinner.succeed(chalk.green(`Compiled in ${Date.now() - start}ms`));
    for (const [filename, css] of Object.entries(result)) {
      if (css.trim()) {
        const kb = (Buffer.byteLength(css, 'utf-8') / 1024).toFixed(1);
        console.log(chalk.gray(`  ${filename.padEnd(20)} ${kb} kB`));
      }
    }
  } catch (e: unknown) {
    spinner.fail(chalk.red('Compilation failed'));
    console.error(chalk.red((e as Error).message));
    process.exit(1);
  }
}
