import path from 'node:path'

import react from '@vitejs/plugin-react'
import { UserConfig, build as viteBuild } from 'vite'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

import { getViteDefines } from '../lib/getViteDefines'
import { onWarn } from '../lib/onWarn'

/**
 * RSC build. Step 2.
 * buildFeServer -> buildRscFeServer -> rscBuildClient
 * Generate the client bundle
 */
// @MARK: I can't seem to remove the duplicated defines here - while it builds
// the output doesn't run anymore (RWJS_ENV undefined etc.)
// why? It's definitely using the vite plugin, but the defines don't come through?
export async function rscBuildClient(clientEntryFiles: Record<string, string>) {
  console.log('Starting RSC client build.... \n')
  const rwPaths = getPaths()

  const rscBuildClientConfig: UserConfig = {
    root: rwPaths.web.src,
    envPrefix: 'REDWOOD_ENV_',
    // @ts-expect-error SHUTUP. Using the wrong type here I think
    envFile: false,
    publicDir: path.join(rwPaths.web.base, 'public'),
    // @TODO: Remove this @MARK: We need to duplicate the defines here.
    define: getViteDefines(),
    plugins: [
      // @TODO override the viteindex
      // @MARK We need to duplicate the plugins here.... otherwise builds fail I don't understand why
      react({
        babel: {
          ...getWebSideDefaultBabelConfig({
            forVite: true,
            // @MARK 👇 This flag is important for RSC Client builds
            forRscClient: true,
          }),
        },
      }),
    ],
    build: {
      outDir: rwPaths.web.distClient,
      emptyOutDir: true, // Needed because `outDir` is not inside `root`
      // TODO (RSC) Enable this when we switch to a server-first approach
      // emptyOutDir: false, // Already done when building server
      rollupOptions: {
        onwarn: onWarn,
        input: {
          // @MARK: temporary hack to find the entry client so we can get the index.css bundle
          // but we don't actually want this on an rsc page!
          'rwjs-client-entry': rwPaths.web.entryClient as string,
          // we need this, so that files with "use client" aren't bundled. I **think** RSC wants an unbundled build
          ...clientEntryFiles,
        },
        preserveEntrySignatures: 'exports-only',
        output: {
          // This is not ideal. See
          // https://rollupjs.org/faqs/#why-do-additional-imports-turn-up-in-my-entry-chunks-when-code-splitting
          // But we need it to prevent `import 'client-only'` from being
          // hoisted into App.tsx
          // TODO (RSC): Fix when https://github.com/rollup/rollup/issues/5235
          // is resolved
          hoistTransitiveImports: false,
        },
      },
      manifest: 'client-build-manifest.json',
    },
    esbuild: {
      logLevel: 'debug',
    },
  }

  if (process.cwd() !== rwPaths.web.base) {
    throw new Error(
      'Looks like you are running the command from the wrong dir, this can lead to unintended consequences on CSS processing',
    )
  }

  const clientBuildOutput = await viteBuild(rscBuildClientConfig)

  if (!('output' in clientBuildOutput)) {
    throw new Error('Unexpected vite client build output')
  }

  return clientBuildOutput.output
}
