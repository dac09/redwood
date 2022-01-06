export const command = 'deploy <target>'
export const description = 'Setup deployment to various targets'
import terminalLink from 'terminal-link'

export const builder = (yargs) =>
  yargs
    .commandDir('./newProviders', { recurse: true })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy'
      )}\n`
    )
