import type { Compiler, Compilation } from 'webpack';
import path from 'path';
import { loadConfig, resolve, emit } from '@holi.dev/core';

const PLUGIN_NAME = 'HoliWebpackPlugin';

const CONFIG_CANDIDATES = [
  'holi.config.ts',
  'holi.config.js',
  'holi.config.mjs',
  'holi.config.json',
  'holi.json',
];

export class HoliWebpackPlugin {
  private cwd: string;

  constructor(options: { cwd?: string } = {}) {
    this.cwd = options.cwd ?? process.cwd();
  }

  apply(compiler: Compiler): void {
    const cwd = this.cwd;

    // Register processAssets tap inside compilation setup
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
      // Add config file dependencies so webpack watches them
      for (const candidate of CONFIG_CANDIDATES) {
        compilation.fileDependencies.add(path.resolve(cwd, candidate));
      }

      // processAssets is an AsyncSeriesHook — safe to use tapPromise
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          // PROCESS_ASSETS_STAGE_ADDITIONS = -1000 (early stage, before optimize)
          stage: -1000,
        },
        async () => {
          const config = await loadConfig(cwd);
          const mode = config.output?.mode ?? 'inline';
          const result = emit(resolve(config, mode));

          for (const [filename, css] of Object.entries(result)) {
            if (css.trim()) {
              compilation.emitAsset(
                filename,
                new compiler.webpack.sources.RawSource(css),
              );
            }
          }
        },
      );
    });
  }
}
