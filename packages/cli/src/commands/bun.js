import fs from 'fs'
import path from 'path'

import execa from 'execa'
import terminalLink from 'terminal-link'

import {
  cleanWebBuild,
  findWebFiles,
  prebuildWebFiles,
  copyAssetsToPrebuild,
} from '@redwoodjs/internal'

import { handler as generateWebIndex } from '../commands/setup/custom-web-index/custom-web-index'
import { getPaths } from '../lib'

export const command = 'bun'
export const description =
  'Run web side dev with bun (assuming you have it installed)'
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

  const outputPath = path.join(getPaths().base, 'bun')
  console.log('Cleaning....')
  cleanWebBuild(outputPath)

  console.log(`Pretranspiling to ${outputPath}....`)

  // Q: Could we run babel inside bun?
  prebuildWebFiles(
    findWebFiles(),
    {
      staticImports: true,
      skipTranspile: true,
    },
    outputPath
  )

  console.log('Copy over non js/ts stuff')
  copyAssetsToPrebuild(outputPath)

  console.log(`Bun bun...`)

  // Q: Maybe have a way of having a hidden index.js
  execa.commandSync('bun bun ./src/index.js', {
    cwd: outputPath,
    shell: true,
    stdio: 'inherit',
  })

  const pathToIndexHtml = path.join(getPaths().web.base, 'public/index.html')

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

  console.log(`Starting bun dev...`)

  // Q: postcss support?
  execa.commandSync('bun', {
    cwd: outputPath,
    shell: true,
    stdio: 'inherit',
  })
}
