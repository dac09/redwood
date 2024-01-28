import path from 'path'

import chalk from 'chalk'
import concurrently from 'concurrently'
import execa from 'execa'

import { createFastifyInstance, redwoodFastifyAPI } from '@redwoodjs/fastify'
import { redwoodFastifyWeb, coerceRootPath } from '@redwoodjs/fastify-web'
import { getConfig, getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { exitWithError } from '../lib/exit'

export const bothServerFileHandler = async (options) => {
  const apiHost = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::'
  const apiProxyTarget = `http://${apiHost}:${options.apiPort}`

  const { result } = concurrently(
    [
      {
        name: 'api',
        command: `yarn node ${path.join('dist', 'server.js')} --port ${
          options.apiPort
        }`,
        cwd: getPaths().api.base,
        prefixColor: 'cyan',
      },
      {
        name: 'web',
        command: `yarn rw-web-server --port ${options.webPort} --api-proxy-target ${apiProxyTarget}`,
        cwd: getPaths().base,
        prefixColor: 'blue',
      },
    ],
    {
      prefix: '{name} |',
      timestampFormat: 'HH:mm:ss',
      handleInput: true,
    }
  )

  try {
    await result
  } catch (error) {
    if (typeof error?.message !== 'undefined') {
      errorTelemetry(
        process.argv,
        `Error concurrently starting sides: ${error.message}`
      )
      exitWithError(error)
    }
  }
}

export const bothServerHandler = async (options) => {
  const { port, socket } = options
  const tsServer = Date.now()

  console.log(chalk.italic.dim('Starting API and Web Servers...'))

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  await fastify.register(redwoodFastifyWeb, {
    redwood: {
      ...options,
    },
  })

  const apiRootPath = coerceRootPath(getConfig().web.apiUrl)

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      ...options,
      apiRootPath,
    },
  })

  let listenOptions

  if (socket) {
    listenOptions = { path: socket }
  } else {
    listenOptions = {
      port,
      host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
    }
  }

  const address = await fastify.listen(listenOptions)

  fastify.ready(() => {
    console.log(chalk.dim.italic('Took ' + (Date.now() - tsServer) + ' ms'))

    const webServer = chalk.green(address)
    const apiServer = chalk.magenta(`${address}${apiRootPath}`)
    const graphqlEndpoint = chalk.magenta(`${apiServer}graphql`)

    console.log(`Web server listening at ${webServer}`)
    console.log(`API server listening at ${apiServer}`)
    console.log(`GraphQL endpoint at ${graphqlEndpoint}`)

    sendProcessReady()
  })
}

function sendProcessReady() {
  return process.send && process.send('ready')
}

export const apiServerFileHandler = async (options) => {
  await execa(
    'yarn',
    [
      'node',
      path.join('dist', 'server.js'),
      '--port',
      options.port,
      '--apiRootPath',
      options.apiRootPath,
    ],
    {
      cwd: getPaths().api.base,
      stdio: 'inherit',
    }
  )
}

export const apiServerHandler = async (options) => {
  const { port, socket, apiRootPath } = options
  const tsApiServer = Date.now()

  console.log(chalk.dim.italic('Starting API Server...'))

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      ...options,
    },
  })

  let listenOptions

  if (socket) {
    listenOptions = { path: socket }
  } else {
    listenOptions = {
      port,
      host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
    }
  }

  const address = await fastify.listen(listenOptions)

  fastify.ready(() => {
    fastify.log.trace(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.trace(`Registered plugins \n${fastify.printPlugins()}`)

    console.log(chalk.dim.italic('Took ' + (Date.now() - tsApiServer) + ' ms'))

    const apiServer = chalk.magenta(`${address}${apiRootPath}`)
    const graphqlEndpoint = chalk.magenta(`${apiServer}graphql`)

    console.log(`API server listening at ${apiServer}`)
    console.log(`GraphQL endpoint at ${graphqlEndpoint}`)

    sendProcessReady()
  })
}