/* eslint-env node, es6*/
const fs = require('fs')
const path = require('path')

const execa = require('execa')
const Listr = require('listr')

const { getExecaOptions, applyCodemod } = require('./util')

// This variable gets used in other functions
// and is set when webTasks or apiTasks are called
let OUTPUT_PATH

function fullPath(name, { addExtension } = { addExtension: true }) {
  if (addExtension) {
    if (name.startsWith('api')) {
      name += '.ts'
    } else if (name.startsWith('web')) {
      name += '.tsx'
    }
  }

  return path.join(OUTPUT_PATH, name)
}

async function webTasks(outputPath) {
  OUTPUT_PATH = outputPath

  const execaOptions = getExecaOptions(outputPath)

  const createBuilder = (cmd) => {
    return async function createItem(name) {
      await execa(`${cmd} ${name}`, [], execaOptions)
    }
  }

  const createPages = async () => {
    const createPage = createBuilder('yarn redwood g page')

    return new Listr([
      {
        title: 'Creating home page',
        task: async () => {
          await createPage('home /')

          return applyCodemod(
            'homePage.js',
            fullPath('web/src/pages/HomePage/HomePage')
          )
        },
      },
      {
        title: 'Creating about page',
        task: async () => {
          await createPage('about')

          return applyCodemod(
            'aboutPage.js',
            fullPath('web/src/pages/AboutPage/AboutPage')
          )
        },
      },
      {
        title: 'Creating contact page',
        task: async () => {
          await createPage('contact')

          return applyCodemod(
            'contactPage.js',
            fullPath('web/src/pages/ContactPage/ContactPage')
          )
        },
      },
      {
        title: 'Creating blog post page',
        task: async () => {
          await createPage('blogPost /blog-post/{id:Int}')

          return applyCodemod(
            'blogPostPage.js',
            fullPath('web/src/pages/BlogPostPage/BlogPostPage')
          )
        },
      },
    ])
  }

  const createLayout = async () => {
    const createLayout = createBuilder('yarn redwood g layout')

    await createLayout('blog')

    return applyCodemod(
      'blogLayout.js',
      fullPath('web/src/layouts/BlogLayout/BlogLayout')
    )
  }

  const createComponents = async () => {
    const createLayout = createBuilder('yarn redwood g component')

    await createLayout('blogPost')

    return applyCodemod(
      'blogPost.js',
      fullPath('web/src/components/BlogPost/BlogPost')
    )
  }

  const createCells = async () => {
    const createCell = createBuilder('yarn redwood g cell')

    await createCell('blogPosts')

    applyCodemod(
      'blogPostsCell.js',
      fullPath('web/src/components/BlogPostsCell/BlogPostsCell')
    )

    await createCell('blogPost')

    return applyCodemod(
      'blogPostCell.js',
      fullPath('web/src/components/BlogPostCell/BlogPostCell')
    )
  }

  return new Listr(
    [
      {
        title: 'Creating pages',
        task: () => createPages(),
      },
      {
        title: 'Creating layout',
        task: () => createLayout(),
      },
      {
        title: 'Creating components',
        task: () => createComponents(),
      },
      {
        title: 'Creating cells',
        task: () => createCells(),
      },
      {
        title: 'Changing routes',
        task: () => applyCodemod('routes.js', fullPath('web/src/Routes')),
      },
      {
        title: 'Adding Tailwind',
        task: () => {
          return execa('yarn rw setup tailwind', ['--force'], execaOptions)
        },
      },
    ],
    {
      exitOnError: true,
    }
  )
}

async function addModel(schema) {
  const path = `${OUTPUT_PATH}/api/db/schema.prisma`

  const current = fs.readFileSync(path)

  fs.writeFileSync(path, `${current}${schema}`)
}

async function apiTasks(outputPath) {
  OUTPUT_PATH = outputPath

  const execaOptionsForProject = getExecaOptions(outputPath)

  return new Listr([
    {
      title: 'Adding post model to prisma',
      task: async () => {
        const { post } = await import('./codemods/models.js')

        addModel(post)

        return execa(
          `yarn rw prisma migrate dev --name create_product`,
          [],
          execaOptionsForProject
        )
      },
    },
    {
      title: 'Scaffoding post',
      task: async () => {
        return execa('yarn rw g scaffold post', [], execaOptionsForProject)
      },
    },
    {
      title: 'Seeding database',
      task: async () => {
        await applyCodemod(
          'seed.js',
          fullPath('api/db/seed.js', { addExtension: false }) // seed.js is seed.js in a TS project too
        )

        return execa('yarn rw prisma db seed', [], execaOptionsForProject)
      },
    },
    {
      title: 'Adding contact model to prisma',
      task: async () => {
        const { contact } = await import('./codemods/models.js')

        addModel(contact)

        await execa(
          `yarn rw prisma migrate dev --name create_contact`,
          [],
          execaOptionsForProject
        )

        await execa(`yarn rw g sdl contact`, [], execaOptionsForProject)

        await applyCodemod(
          'contactsSdl.js',
          fullPath('api/src/graphql/contacts.sdl')
        )
      },
    },
  ])
}

module.exports = {
  apiTasks,
  webTasks,
}
