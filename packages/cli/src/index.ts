import { Command } from 'commander';
import { init }  from './commands/init';
import { build } from './commands/build';
import { watch } from './commands/watch';

const program = new Command('holi').version('0.1.0');

program
  .command('init')
  .description('Scaffold holi.config.json in the current directory')
  .action(() => init(process.cwd()));

program
  .command('build')
  .description('Compile holi.config.json and write CSS output')
  .option('-c, --config <path>', 'path to config file', 'holi.config.json')
  .action((opts: { config: string }) => build(opts.config));

program
  .command('watch')
  .description('Watch config file and rebuild on every change')
  .option('-c, --config <path>', 'path to config file', 'holi.config.json')
  .action((opts: { config: string }) => watch(opts.config));

program.parse();
