import { build, defaultIgnorePatterns, defaultBuildOptions } from '@redwoodjs/framework-tools'

import * as esbuild from 'esbuild'

// ESM build
await build({
  entryPointOptions: {
    ignore: [...defaultIgnorePatterns, '**/bundled'],
  },
  buildOptions: {
    ...defaultBuildOptions,
    format: 'esm',
    packages: 'external',
  },
})

// CJS build
await build({
  entryPointOptions: {
    ignore: [...defaultIgnorePatterns, '**/bundled'],
  },
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.build-cjs.json',
    outdir: 'dist/cjs',
    packages: 'external',
  },
})

// We bundle some react packages with the "react-server" condition
// so that we don't need to specify it at runtime.

await esbuild.build({
  entryPoints: ['src/bundled/*'],
  outdir: 'dist/bundled',

  bundle: true,
  conditions: ['react-server'],
  platform: 'node',
  target: ['node20'],

  logLevel: 'info',
})
