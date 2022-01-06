// import terminalLink from 'terminal-link'
import fs from 'fs'
import path from 'path'

import { getSchema, getConfig } from '@prisma/sdk'
import Listr from 'listr'

import { getPaths, writeFilesTask } from '../../../../lib'
import c from '../../../../lib/colors'
import {
  createAddFilesTask,
  createAddPackagesTask,
  printSetupNotes,
  updateApiURLTask,
} from '../helpers'
import {
  POSTGRES_YAML,
  RENDER_HEALTH_CHECK,
  RENDER_YAML,
  SQLITE_YAML,
} from '../templates/render'

export const command = 'render'
export const description = 'Setup Render deploy'

export const getRenderYamlContent = async (database) => {
  if (database === 'none') {
    return {
      path: path.join(getPaths().base, 'render.yaml'),
      content: RENDER_YAML(''),
    }
  }
  if (!fs.existsSync('api/db/schema.prisma')) {
    throw new Error("Could not find prisma schema at 'api/db/schema.prisma'")
  }

  const schema = await getSchema('api/db/schema.prisma')
  const config = await getConfig({ datamodel: schema })
  const detectedDatabase = config.datasources[0].activeProvider

  if (detectedDatabase === database) {
    switch (database) {
      case 'postgresql':
        return {
          path: path.join(getPaths().base, 'render.yaml'),
          content: RENDER_YAML(POSTGRES_YAML),
        }
      case 'sqlite':
        return {
          path: path.join(getPaths().base, 'render.yaml'),
          content: RENDER_YAML(SQLITE_YAML),
        }
      default:
        throw new Error(`
       Unexpected datasource provider found: ${database}`)
    }
  } else {
    throw new Error(`
    Prisma datasource provider is detected to be ${detectedDatabase}.

    Option 1: Update your schema.prisma provider to be ${database}, then run
    yarn rw prisma migrate dev
    yarn rw setup deploy render --database ${database}

    Option 2: Rerun setup deploy command with current schema.prisma provider:
    yarn rw setup deploy render --database ${detectedDatabase}`)
  }
}

export const builder = (yargs) =>
  yargs.option('database', {
    alias: 'd',
    choices: ['none', 'postgresql', 'sqlite'],
    description: 'Database deployment for Render only',
    default: 'postgresql',
    type: 'string',
  })

// any notes to print out when the job is done
const notes = [
  'You are ready to deploy to Render!\n',
  'Go to https://dashboard.render.com/iacs to create your account and deploy to Render',
  'Check out the deployment docs at https://render.com/docs/deploy-redwood for detailed instructions',
  'Note: After first deployment to Render update the rewrite rule destination in `./render.yaml`',
]

const additionalFiles = [
  {
    path: path.join(getPaths().base, 'api/src/functions/healthz.js'),
    content: RENDER_HEALTH_CHECK,
  },
]

export const handler = async ({ force, database }) => {
  const gg = createAddPackagesTask({
    packages: ['@redwoodjs/api-server'],
    side: 'api',
  })
  console.log(`🗯 \n ~ file: render.js ~ line 99 ~ gg`, gg)
  const tasks = new Listr([
    {
      title: 'Adding render.yaml',
      task: async () => {
        const fileData = await getRenderYamlContent(database)
        let files = {}
        files[fileData.path] = fileData.content
        return writeFilesTask(files, { overwriteExisting: force })
      },
    },
    createAddPackagesTask({
      packages: ['@redwoodjs/api-server'],
      side: 'api',
    }),
    updateApiURLTask('/.redwood/functions'),
    // Add health check api function
    createAddFilesTask({
      files: additionalFiles,
      force,
    }),
    printSetupNotes(notes),
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
