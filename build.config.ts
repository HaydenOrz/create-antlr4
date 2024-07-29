import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      minify: true,
      target: 'node16',
    },
  },
  alias: {
    prompts: 'prompts/lib/index.js',
  },
});
