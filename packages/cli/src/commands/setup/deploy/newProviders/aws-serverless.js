// import terminalLink from 'terminal-link'

export const command = 'aws-serverless'
export const description = 'Setup AWS deploy, with Serverless framework'
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
    console.log('Setting up AWS-Serverless!')
  } catch (e) {
    console.log('Error: Cannot access environment info')
    console.log(e)
    process.exit(1)
  }
}
