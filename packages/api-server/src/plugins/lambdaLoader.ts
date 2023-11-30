import path from 'path'

import { createServerAdapter } from '@whatwg-node/server'
import c from 'ansi-colors'
import type { Handler } from 'aws-lambda'
import fg from 'fast-glob'
import type {
  FastifyReply,
  FastifyRequest,
  RequestGenericInterface,
} from 'fastify'
import { escape } from 'lodash'

import { getPaths } from '@redwoodjs/project-config'

import { requestHandler } from '../requestHandlers/awsLambdaFastify'

export type Lambdas = Record<string, Handler>
export const LAMBDA_FUNCTIONS: Lambdas = {}

// Import the API functions and add them to the LAMBDA_FUNCTIONS object

export const setLambdaFunctions = async (foundFunctions: string[]) => {
  const tsImport = Date.now()
  console.log(c.italic(c.dim('Importing Server Functions... ')))

  const imports = foundFunctions.map((fnPath) => {
    return new Promise((resolve) => {
      const ts = Date.now()
      const routeName = path.basename(fnPath).replace('.js', '')

      const { handler } = require(fnPath)
      LAMBDA_FUNCTIONS[routeName] = handler
      if (!handler) {
        console.warn(
          routeName,
          'at',
          fnPath,
          'does not have a function called handler defined.'
        )
      }
      // TODO: Use terminal link.
      console.log(
        c.magenta('/' + routeName),
        c.italic(c.dim(Date.now() - ts + ' ms'))
      )
      return resolve(true)
    })
  })

  Promise.all(imports).then((_results) => {
    console.log(
      c.italic(c.dim('...Done importing in ' + (Date.now() - tsImport) + ' ms'))
    )
  })
}

// TODO: Use v8 caching to load these crazy fast.
export const loadFunctionsFromDist = async () => {
  const serverFunctions = findApiDistFunctions()
  // Place `GraphQL` serverless function at the start.
  const i = serverFunctions.findIndex((x) => x.indexOf('graphql') !== -1)
  if (i >= 0) {
    const graphQLFn = serverFunctions.splice(i, 1)[0]
    serverFunctions.unshift(graphQLFn)
  }
  await setLambdaFunctions(serverFunctions)
}

// NOTE: Copied from @redwoodjs/internal/dist/files to avoid depending on @redwoodjs/internal.
// import { findApiDistFunctions } from '@redwoodjs/internal/dist/files'
function findApiDistFunctions(cwd: string = getPaths().api.base) {
  return fg.sync('dist/functions/**/*.{ts,js}', {
    cwd,
    deep: 2, // We don't support deeply nested api functions, to maximise compatibility with deployment providers
    absolute: true,
  })
}

interface LambdaHandlerRequest extends RequestGenericInterface {
  Params: {
    routeName: string
  }
}

// const myServerAdapter = createServerAdapter((_request: Request) => {
//   console.log(`👉 \n ~ file: lambdaLoader.ts:87 ~ _request:`, _request)
//   console.log(
//     `👉 \n ~ file: lambdaLoader.ts:90 ~ LAMBDA_FUNCTIONS:`,
//     LAMBDA_FUNCTIONS
//   )
//   return LAMBDA_FUNCTIONS['bazinga']
// })

export const fetchRequestHandler = async (
  req: FastifyRequest<LambdaHandlerRequest>,
  reply: FastifyReply
): Promise<FastifyReply> => {
  const { routeName } = req.params

  // @ts-expect-error handle errors later
  const myServerAdapter = createServerAdapter(LAMBDA_FUNCTIONS[routeName])

  const response = await myServerAdapter.handleNodeRequest(req, {
    req,
    reply,
  })

  console.log(`👉 \n ~ file: lambdaLoader.ts:99 ~ response:`, response)

  response.headers.forEach((value, key) => {
    reply.header(key, value)
  })

  reply.status(response.status)

  // Fastify doesn't accept `null` as a response body
  reply.send(response.body || undefined)

  return reply
}

/**
 This will take a fastify request
 Then convert it to a lambdaEvent, and pass it to the the appropriate handler for the routeName
 The LAMBDA_FUNCTIONS lookup has been populated already by this point
 **/
export const lambdaRequestHandler = async (
  req: FastifyRequest<LambdaHandlerRequest>,
  reply: FastifyReply
) => {
  const { routeName } = req.params

  if (!LAMBDA_FUNCTIONS[routeName]) {
    const errorMessage = `Function "${routeName}" was not found.`
    req.log.error(errorMessage)
    reply.status(404)

    if (process.env.NODE_ENV === 'development') {
      const devError = {
        error: errorMessage,
        availableFunctions: Object.keys(LAMBDA_FUNCTIONS),
      }
      reply.send(devError)
    } else {
      reply.send(escape(errorMessage))
    }

    return
  }
  return requestHandler(req, reply, LAMBDA_FUNCTIONS[routeName])
}
