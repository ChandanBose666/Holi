import { Command } from 'commander';
import { init }        from './commands/init';
import { build }       from './commands/build';
import { watch }       from './commands/watch';
import { importDTCG }  from './commands/import';

const program = new Command('holi').version('0.2.0');

program
  .command('init')
  .description('Scaffold holi.config.ts in the current directory')
  .action(() => init(process.cwd()));

program
  .command('build')
  .description('Compile Holi config and write CSS output')
  .option('-c, --config <path>', 'path to config file or directory', '.')
  .action((opts: { config: string }) => build(opts.config));

program
  .command('watch')
  .description('Watch config and rebuild on every change')
  .option('-c, --config <path>', 'path to config file or directory', '.')
  .action((opts: { config: string }) => watch(opts.config));

program
  .command('import')
  .description('Import a design token file and write holi.config.ts')
  .requiredOption('--from <path>', 'input file path')
  .option('--format <format>', 'token format (dtcg)', 'dtcg')
  .action((opts: { from: string; format: string }) => importDTCG(opts));

program.parse();
