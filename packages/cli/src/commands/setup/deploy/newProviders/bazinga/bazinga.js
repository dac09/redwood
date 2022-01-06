// inspired by gatsby/packages/gatsby-cli/src/create-cli.js and
// and gridsome/packages/cli/lib/commands/info.js
// import terminalLink from 'terminal-link'

export const command = 'bazinga'
export const description = 'Setup bazinga deploy'
// export const builder = (yargs) => {
//   yargs.epilogue(
//     `Also see the ${terminalLink(
//       'Redwood CLI Reference',
//       'https://redwoodjs.com/reference/command-line-interface#info'
//     )}`
//   )
// }
export const handler = async () => {
  try {
    console.log('~~~~ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ~~~~~')
    console.log('~~~~ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ~~~~~')
    console.log('Setting up bazinga!')
  } catch (e) {
    console.log('Error: Cannot access environment info')
    console.log(e)
    process.exit(1)
  }
}
