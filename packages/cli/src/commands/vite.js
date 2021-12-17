import fs from 'fs'
import path from 'path'

import execa from 'execa'
import fse from 'fs-extra'
import terminalLink from 'terminal-link'

import {
  cleanWebBuild,
  findWebFiles,
  prebuildWebFiles,
  copyAssetsToPrebuild,
} from '@redwoodjs/internal'

import { handler as generateWebIndex } from '../commands/setup/custom-web-index/custom-web-index'
import { getPaths } from '../lib'

export const command = 'vite'
export const description =
  'Run web side dev with vite (assuming you have it installed)'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#info'
    )}`
  )
}

export const handler = async () => {
  const indexEntryPresent = fs.existsSync(getPaths().web.index)

  if (!indexEntryPresent) {
    // Add index file
    console.log('Generating web index.js')
    await generateWebIndex({ force: true })
  }

  const outputPath = path.join(getPaths().base, 'vite')
  console.log('Cleaning....')
  cleanWebBuild(outputPath)

  // console.log(`Pretranspiling to ${outputPath}....`)

  // prebuildWebFiles(
  //   findWebFiles(),
  //   {
  //     staticImports: false,
  //     skipTranspile: true,
  //   },
  //   outputPath
  // )

  // console.log('Copy over non js/ts stuff')
  // copyAssetsToPrebuild(outputPath)

  console.log('Copying web folder to vite')
  fse.copySync(getPaths().web.src, path.join(outputPath, 'src'))

  // Polyfill global in vite/src/index.js
  const viteIndexJs = path.join(outputPath, 'src/index.js')
  const indexJSContent = fs.readFileSync(viteIndexJs, 'utf-8')
  fs.writeFileSync(viteIndexJs, `global = globalThis; ${indexJSContent}`)

  const pathToIndexHtml = path.join(outputPath, 'index.html')
  const viteConfigPath = path.join(outputPath, 'vite.config.js')

  if (!fs.existsSync(viteConfigPath)) {
    console.log('Add viteconfig')
    fs.writeFileSync(
      `import { defineConfig } from 'vite'
      import react from '@vitejs/plugin-react'
      import path from 'node:path'

      import { getEnvVars } from '@redwoodjs/core/config/webpack.common'
      import { getConfig, getPaths } from '@redwoodjs/internal'

      const redwoodConfig = getConfig()
      const redwoodPaths = getPaths()

      // https://vitejs.dev/config/
      export default defineConfig({
        plugins: [react()],
        server: {
          proxy: {
            '/api': {
              target: 'http://localhost:8911',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          },
        },
        define: {
          'process.env': {
            ...getEnvVars(),
            RWJS_API_GRAPHQL_URL:
              redwoodConfig.web.apiGraphQLUrl ??
              \`${redwoodConfig.web.apiUrl}/graphql\`,
            RWJS_API_DBAUTH_URL:
              redwoodConfig.web.apiDbAuthUrl ?? \`${redwoodConfig.web.apiUrl}/auth\`,
            RWJS_API_URL: redwoodConfig.web.apiUrl,
            __REDWOOD__APP_TITLE:
              redwoodConfig.web.title || path.basename(redwoodPaths.base),
          },
          global: {},
        },
      })`
    )
  }

  // Q: Could we specify the index.html specifically to be somewhere else?
  // OR automatically insert
  if (!fs.existsSync(pathToIndexHtml)) {
    console.log('Adding index.html with index import')
    fs.writeFileSync(
      pathToIndexHtml,
      `<!DOCTYPE html>
    <html lang="en">

    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <script src="/src/index.js" async type="module"></script>

    </head>

    <body>
      <div id="redwood-app">
      </div>
    </body>

    </html>
    `
    )
  }

  console.log(`Starting vite dev...`)

  // Q: postcss support?
  execa.commandSync('vite', {
    cwd: outputPath,
    shell: true,
    stdio: 'inherit',
  })
}
