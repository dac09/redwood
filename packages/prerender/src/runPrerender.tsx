import fs from 'fs'
import path from 'path'

import React from 'react'

import babelRequireHook from '@babel/register'
import cheerio from 'cheerio'
import prettier from 'prettier'
import ReactDOMServer from 'react-dom/server'
import type { HelmetData } from 'react-helmet-async'

import { getPaths } from '@redwoodjs/internal'
import { LocationProvider } from '@redwoodjs/router'

import mediaImportsPlugin from './babelPlugins/babel-plugin-redwood-prerender-media-imports'
import { getRootHtmlPath, registerShims, writeToDist } from './internal'

interface PrerenderParams {
  routerPath: string // e.g. /about, /dashboard/me
  outputHtmlPath: string // web/dist/{path}.html
  dryRun: boolean
}

const rwWebPaths = getPaths().web

// Prerender specific configuration
// extends projects web/babelConfig
babelRequireHook({
  extends: path.join(rwWebPaths.base, '.babelrc.js'),
  extensions: ['.js', '.ts', '.tsx', '.jsx'],
  plugins: [
    ['ignore-html-and-css-imports'], // webpack/postcss handles CSS imports
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          src: rwWebPaths.src,
        },
      },
    ],
    [mediaImportsPlugin],
  ],
  only: [rwWebPaths.base],
  ignore: ['node_modules'],
  cache: false,
})

export const runPrerender = async ({
  routerPath,
  outputHtmlPath,
  dryRun,
}: PrerenderParams): Promise<string | void> => {
  registerShims()

  const indexContent = fs.readFileSync(getRootHtmlPath()).toString()

  const { default: App } = await import(getPaths().web.app)

  const componentAsHtml = ReactDOMServer.renderToString(
    <LocationProvider
      location={{
        pathname: routerPath,
      }}
    >
      <App />
    </LocationProvider>
  )

  const { helmet } = global.__REDWOOD__HELMET_CONTEXT

  const indexHtmlTree = cheerio.load(indexContent)

  if (helmet) {
    const helmetElements = `
  ${helmet?.link.toString()}
  ${helmet?.meta.toString()}
  ${helmet?.script.toString()}
  ${helmet?.noscript.toString()}
  `

    // Add all head elements
    indexHtmlTree('head').prepend(helmetElements)

    // Only change the title, if its not empty
    if (cheerio.load(helmet?.title.toString())('title').text() !== '') {
      indexHtmlTree('title').replaceWith(helmet?.title.toString())
    }
  }

  // This is set by webpack by the html plugin
  indexHtmlTree('server-markup').replaceWith(componentAsHtml)

  const renderOutput = indexHtmlTree.html()

  if (dryRun) {
    console.log('::: Dry run, not writing changes :::')
    console.log(`::: 🚀 Prerender output for ${routerPath} ::: `)
    const prettyOutput = prettier.format(renderOutput, { parser: 'html' })
    console.log(prettyOutput)
    console.log('::: --- ::: ')

    return prettyOutput
  }

  if (outputHtmlPath) {
    // Copy default index.html to 200.html first
    // This is to prevent recursively rendering the home page
    if (outputHtmlPath === 'web/dist/index.html') {
      fs.copyFileSync(outputHtmlPath, 'web/dist/200.html')
    }

    writeToDist(outputHtmlPath, renderOutput)
  }
}
